// ── Neural Sync — Client-Side Memory Store ─────────────────────────────────
// Pure IndexedDB + localStorage implementation. No external API required.
// Uses TF-IDF cosine similarity for retrieval.

export interface MemoryChunk {
  id: string
  content: string
  embedding: Record<string, number> // TF-IDF vector (sparse)
  metadata: {
    chatId?: string
    type: 'user' | 'assistant' | 'code' | 'workspace'
    timestamp: number
    label?: string
  }
}

// ── TF-IDF Helpers ────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'are', 'was', 'were',
  'will', 'you', 'can', 'but', 'not', 'have', 'has', 'had', 'been', 'they',
  'what', 'when', 'how', 'why', 'there', 'here', 'its', 'also', 'use', 'get',
])

function buildTFVector(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {}
  const filtered = tokens.filter(t => !STOPWORDS.has(t))
  filtered.forEach(t => { freq[t] = (freq[t] ?? 0) + 1 })
  const total = filtered.length || 1
  Object.keys(freq).forEach(k => { freq[k] = freq[k] / total })
  return freq
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const k in a) {
    normA += a[k] ** 2
    if (b[k]) dot += a[k] * b[k]
  }
  for (const k in b) normB += b[k] ** 2
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ── IndexedDB Store ────────────────────────────────────────────────────────────
const DB_NAME = 'intellivex-memory'
const DB_VERSION = 1
const STORE_NAME = 'chunks'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getAllChunks(): Promise<MemoryChunk[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as MemoryChunk[])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

async function putChunk(chunk: MemoryChunk): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(chunk)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[Memory] Failed to persist chunk:', e)
  }
}

async function deleteChunk(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* silent */ }
}

// ── Public API ─────────────────────────────────────────────────────────────────

const MAX_CHUNKS = 200
const CHUNK_SIZE = 600 // chars per chunk

function chunkText(text: string): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }
  return chunks
}

export async function addMemory(
  content: string,
  metadata: Omit<MemoryChunk['metadata'], 'timestamp'>
): Promise<void> {
  if (!content || content.trim().length < 30) return
  const chunks = chunkText(content.trim())
  for (const chunk of chunks) {
    const tokens = tokenize(chunk)
    const embedding = buildTFVector(tokens)
    const mem: MemoryChunk = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content: chunk,
      embedding,
      metadata: { ...metadata, timestamp: Date.now() },
    }
    await putChunk(mem)
  }

  // Prune oldest if over limit
  const all = await getAllChunks()
  if (all.length > MAX_CHUNKS) {
    const sorted = all.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp)
    for (const old of sorted.slice(0, all.length - MAX_CHUNKS)) {
      await deleteChunk(old.id)
    }
  }
}

export async function retrieveMemory(
  query: string,
  topK = 3,
  minScore = 0.05
): Promise<MemoryChunk[]> {
  try {
    const all = await getAllChunks()
    if (all.length === 0) return []
    const queryVec = buildTFVector(tokenize(query))
    const scored = all
      .map(chunk => ({ chunk, score: cosineSimilarity(queryVec, chunk.embedding) }))
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map(s => s.chunk)
  } catch {
    return []
  }
}

export async function indexWorkspaceFile(name: string, code: string): Promise<void> {
  await addMemory(code, { type: 'workspace', label: name })
}

export async function getAllMemories(): Promise<MemoryChunk[]> {
  const all = await getAllChunks()
  return all.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
}

export async function deleteMemory(id: string): Promise<void> {
  await deleteChunk(id)
}

export async function clearAllMemories(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* silent */ }
}

export function formatMemoryForPrompt(chunks: MemoryChunk[]): string {
  if (chunks.length === 0) return ''
  const content = chunks
    .map((c, i) => `[${i + 1}] ${c.metadata.label ? `(${c.metadata.label}) ` : ''}${c.content}`)
    .join('\n---\n')
  return `[INTERNAL_MEMORY — relevant context from previous sessions]:\n${content}`
}
