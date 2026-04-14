import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@clerk/backend'

// ── Vercel config: extend timeout for HF cold starts ─────────────────────────
export const config = { maxDuration: 60 }

// ── Environment Helpers ───────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const CLERK_SECRET = process.env.CLERK_SECRET_KEY || ''

// ── Supabase (service role) ───────────────────────────────────────────────────
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getClerkUserId(req: VercelRequest): Promise<string | null> {
  const auth = req.headers.authorization ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  
  if (!CLERK_SECRET) {
    console.error('Missing CLERK_SECRET_KEY')
    return null
  }

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET })
    return payload.sub ?? null
  } catch (err) {
    console.error('Identity verification failed (generate-image):', err)
    return null
  }
}

// ── HF model cascade: new router endpoint (api-inference.huggingface.co is retired) ──
const HF_MODELS = [
  {
    url: 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    params: { num_inference_steps: 4, guidance_scale: 0.0 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-1',
    params: { num_inference_steps: 25, guidance_scale: 7.5 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5',
    params: { num_inference_steps: 20, guidance_scale: 7.5 },
  },
  {
    url: 'https://router.huggingface.co/hf-inference/models/Lykon/dreamshaper-7',
    params: { num_inference_steps: 20, guidance_scale: 7.5 },
  },
]

async function callHfModel(
  hfKey: string,
  prompt: string,
  modelUrl: string,
  params: Record<string, number>,
  timeoutMs = 50_000,
): Promise<Response | null> {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(modelUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: params }),
      signal: ctrl.signal,
    })
    clearTimeout(tid)
    return r
  } catch (e: any) {
    clearTimeout(tid)
    const name = (e as Error)?.name ?? ''
    if (name === 'AbortError') {
      console.warn(`[generate-image] ${modelUrl} timed out`)
    } else {
      console.warn(`[generate-image] ${modelUrl} network error:`, (e as Error)?.message)
    }
    return null
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth
  const userId = await getClerkUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { prompt, style, chatId } = req.body ?? {}
  if (!prompt?.trim() || !chatId) {
    return res.status(400).json({ error: 'Missing prompt or chatId' })
  }

  // HF key validation
  const hfKey = (process.env.HF_API_KEY ?? '').trim()
  if (!hfKey || hfKey.length < 8 || !hfKey.startsWith('hf_')) {
    return res.status(500).json({
      error: 'HF_API_KEY not configured on server.',
      code: 'NO_HF_KEY',
    })
  }

  const supabase = getSupabase()

  // Daily limit
  const DAILY_LIMIT = 10
  const today = new Date().toISOString().slice(0, 10)
  let currentCount = 0

  if (supabase) {
    const { data } = await supabase
      .from('image_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()
    currentCount = (data as any)?.count ?? 0
    if (currentCount >= DAILY_LIMIT) {
      return res.status(429).json({
        error: `Daily image limit reached (${DAILY_LIMIT}/day). Try again tomorrow!`,
        code: 'DAILY_LIMIT_EXCEEDED',
        used: currentCount,
        limit: DAILY_LIMIT,
      })
    }
  }

  // Prompt enhancement
  const STYLE_SUFFIX: Record<string, string> = {
    realistic: ', ultra realistic, 8k, RAW photo, photorealistic, depth of field, sharp focus',
    anime: ', anime style, vibrant colors, highly detailed anime art, studio ghibli quality',
    cinematic: ', cinematic film still, dramatic lighting, anamorphic lens, movie scene, 4k',
    'digital art': ', digital illustration, concept art, artstation trending, octane render, 4k',
  }
  const styleSuffix = style ? (STYLE_SUFFIX[style] ?? '') : ', realistic, 8k resolution, sharp focus'
  const enhancedPrompt = `${prompt.trim()}, high quality, detailed${styleSuffix}`

  // HF cascade
  let hfRes: Response | null = null
  let lastStatus = 0

  for (const model of HF_MODELS) {
    const shortName = model.url.split('/').slice(-2).join('/')
    console.log(`[generate-image] Trying ${shortName}`)
    const r = await callHfModel(hfKey, enhancedPrompt, model.url, model.params)

    if (!r) continue

    lastStatus = r.status

    if (r.status === 503) {
      console.warn(`[generate-image] ${shortName} → 503 (warming up)`)
      continue
    }
    if (r.status === 410 || r.status === 404) {
      console.warn(`[generate-image] ${shortName} → ${r.status} (model gone)`)
      continue
    }
    if (r.status === 401 || r.status === 403) {
      return res.status(401).json({
        error: `HF_API_KEY is invalid or expired (${r.status}). Update VERCEL env variable.`,
        code: 'INVALID_HF_KEY',
      })
    }
    if (!r.ok) {
      console.warn(`[generate-image] ${shortName} → ${r.status}`)
      continue
    }

    hfRes = r
    break
  }

  if (!hfRes) {
    return res.status(503).json({
      error: lastStatus === 503
        ? 'Image models are warming up. Wait ~60 seconds and try again.'
        : 'Image generation unavailable right now. All models are offline — try again later.',
      code: 'ALL_MODELS_FAILED',
    })
  }

  const contentType = hfRes.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return res.status(502).json({ error: 'Unexpected response from image model' })
  }

  const arrayBuffer = await hfRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to Supabase Storage
  let imageUrl = ''

  if (supabase) {
    const storagePath = `${userId}/${Date.now()}.png`
    try {
      const { error: storageErr } = await supabase.storage
        .from('generated-images')
        .upload(storagePath, buffer, { contentType: 'image/png', upsert: false })

      if (!storageErr) {
        const { data: pub } = supabase.storage
          .from('generated-images')
          .getPublicUrl(storagePath)
        imageUrl = pub.publicUrl

        // Persist image message
        await supabase.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          type: 'image',
          content: prompt.trim(),
          image_url: imageUrl,
          prompt: enhancedPrompt,
        })

        // Upsert daily usage
        await supabase.from('image_usage').upsert(
          { user_id: userId, date: today, count: currentCount + 1 },
          { onConflict: 'user_id,date' },
        )
      } else {
        console.warn('[generate-image] Storage upload error:', storageErr.message)
      }
    } catch (e) {
      console.warn('[generate-image] Supabase storage exception:', e)
    }
  }

  // Fallback: base64 data-URL
  if (!imageUrl) {
    imageUrl = `data:image/png;base64,${buffer.toString('base64')}`
  }

  return res.status(200).json({
    url: imageUrl,
    enhancedPrompt,
    fromCache: false,
    used: currentCount + 1,
    limit: DAILY_LIMIT,
  })
}
