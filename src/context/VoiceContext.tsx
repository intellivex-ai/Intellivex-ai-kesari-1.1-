import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface VoiceContextValue {
  listening: boolean
  speaking: boolean
  immersiveMode: boolean
  transcript: string
  frequencyData: Uint8Array | null
  toggleListening: (onResult?: (text: string) => void) => void
  speakText: (text: string) => void
  stopSpeaking: () => void
  toggleImmersive: () => void
}

const VoiceCtx = createContext<VoiceContextValue | null>(null)

export function useVoice() {
  const ctx = useContext(VoiceCtx)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}

// ── Web Audio Analyser ────────────────────────────────────────────────────────
function createAnalyserForAudio(audio: HTMLAudioElement): {
  analyser: AnalyserNode
  dataArray: Uint8Array
  cleanup: () => void
} {
  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(audio)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  analyser.connect(ctx.destination)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  return {
    analyser,
    dataArray,
    cleanup: () => { try { ctx.close() } catch { /* silent */ } },
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [immersiveMode, setImmersiveMode] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<{ analyser: AnalyserNode; dataArray: Uint8Array; cleanup: () => void } | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      analyserRef.current?.cleanup()
      window.speechSynthesis.cancel()
    }
  }, [])

  const startFrequencyTracking = useCallback(() => {
    const tick = () => {
      if (!analyserRef.current) return
      analyserRef.current.analyser.getByteFrequencyData(analyserRef.current.dataArray)
      setFrequencyData(new Uint8Array(analyserRef.current.dataArray))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const stopFrequencyTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    analyserRef.current?.cleanup()
    analyserRef.current = null
    setFrequencyData(null)
  }, [])

  // ── STT ────────────────────────────────────────────────────────────────────
  const toggleListening = useCallback((onResult?: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(t)
      if (e.results[e.results.length - 1].isFinal) {
        onResult?.(t)
        setTranscript('')
        setListening(false)
      }
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }, [listening])

  // ── TTS (Web Speech API with audio-reactive hook) ─────────────────────────
  const speakText = useCallback((text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    setSpeaking(false)
    stopFrequencyTracking()

    // Web Speech API TTS (works natively, no API key)
    // Optional: ElevenLabs can be wired here behind VITE_ELEVENLABS_API_KEY
    const clean = text.replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '').slice(0, 3000)
    if (!clean.trim()) return

    const utterance = new SpeechSynthesisUtterance(clean)
    utteranceRef.current = utterance

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US')
    if (preferred) utterance.voice = preferred
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      setSpeaking(false)
      stopFrequencyTracking()
    }
    utterance.onerror = () => {
      setSpeaking(false)
      stopFrequencyTracking()
    }

    // Simulate frequency data for visual reactivity during speech
    // (Web Speech API doesn't expose audio nodes directly)
    let simFrame: ReturnType<typeof setTimeout> | null = null
    utterance.onstart = () => {
      setSpeaking(true)
      const sim = () => {
        const arr = new Uint8Array(32)
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 180 + 40)
        }
        setFrequencyData(arr)
        simFrame = setTimeout(sim, 80)
      }
      sim()
    }
    utterance.onend = () => {
      setSpeaking(false)
      if (simFrame) clearTimeout(simFrame)
      setFrequencyData(null)
    }
    utterance.onerror = () => {
      setSpeaking(false)
      if (simFrame) clearTimeout(simFrame)
      setFrequencyData(null)
    }

    window.speechSynthesis.speak(utterance)
  }, [stopFrequencyTracking])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    stopFrequencyTracking()
  }, [stopFrequencyTracking])

  const toggleImmersive = useCallback(() => {
    setImmersiveMode(prev => !prev)
  }, [])

  return (
    <VoiceCtx.Provider value={{
      listening,
      speaking,
      immersiveMode,
      transcript,
      frequencyData,
      toggleListening,
      speakText,
      stopSpeaking,
      toggleImmersive,
    }}>
      {children}
    </VoiceCtx.Provider>
  )
}
