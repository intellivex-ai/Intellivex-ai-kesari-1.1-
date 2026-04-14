import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { useVoice } from '../context/VoiceContext'
import { IntellivexLogo } from './Logo'

// ── Frequency visualizer bars ─────────────────────────────────────────────────
function FreqBars({ frequencyData }: { frequencyData: Uint8Array | null }) {
  if (!frequencyData) return null
  const bars = Array.from(frequencyData).slice(0, 24)
  return (
    <div className="orb-freq-bars">
      {bars.map((val, i) => (
        <div
          key={i}
          className="orb-freq-bar"
          style={{ height: `${Math.max(4, (val / 255) * 80)}px` }}
        />
      ))}
    </div>
  )
}

// ── Canvas orb pulse ─────────────────────────────────────────────────────────
function OrbCanvas({ frequencyData, speaking }: { frequencyData: Uint8Array | null; speaking: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const cx = W / 2
    const cy = H / 2
    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Base amplitude from frequency data
      const avgFreq = frequencyData
        ? Array.from(frequencyData.slice(0, 8)).reduce((s, v) => s + v, 0) / 8 / 255
        : 0

      const pulse = speaking ? avgFreq * 0.35 : 0.05

      // Outer glow ring
      const outerR = 110 + Math.sin(t * 1.2) * 8 * (1 + pulse * 2)
      const grd = ctx.createRadialGradient(cx, cy, outerR * 0.4, cx, cy, outerR)
      grd.addColorStop(0, 'rgba(16,185,129,0.18)')
      grd.addColorStop(0.5, 'rgba(16,185,129,0.07)')
      grd.addColorStop(1, 'rgba(16,185,129,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
      ctx.fill()

      // Middle ring
      const midR = 75 + Math.sin(t * 2.1 + 1) * 5 * (1 + pulse * 3)
      ctx.beginPath()
      ctx.arc(cx, cy, midR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(16,185,129,${0.15 + pulse * 0.5})`
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Inner core
      const coreR = 42 + Math.sin(t * 3 + 2) * 3 * (1 + pulse * 4)
      const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
      coreGrd.addColorStop(0, `rgba(52,211,153,${0.6 + pulse * 0.4})`)
      coreGrd.addColorStop(0.6, `rgba(16,185,129,${0.3 + pulse * 0.3})`)
      coreGrd.addColorStop(1, 'rgba(16,185,129,0)')
      ctx.fillStyle = coreGrd
      ctx.beginPath()
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
      ctx.fill()

      t += 0.025
      frameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [frequencyData, speaking])

  return <canvas ref={canvasRef} className="orb-canvas" />
}

// ── Main VoiceOrb ─────────────────────────────────────────────────────────────
export function VoiceOrb() {
  const { immersiveMode, listening, speaking, transcript, frequencyData, toggleListening, stopSpeaking, toggleImmersive } = useVoice()

  return (
    <AnimatePresence>
      {immersiveMode && (
        <motion.div
          className="voice-orb-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Cinematic grain overlay */}
          <div className="voice-orb-grain" />

          {/* Close button */}
          <motion.button
            className="voice-orb-close"
            onClick={toggleImmersive}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            title="Exit immersive mode"
          >
            <X size={18} />
          </motion.button>

          {/* Main orb */}
          <motion.div
            className="voice-orb-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="voice-orb-canvas-wrap">
              <OrbCanvas frequencyData={frequencyData} speaking={speaking} />
              <div className="voice-orb-logo">
                <IntellivexLogo size={64} />
              </div>
            </div>

            {/* Status label */}
            <motion.p
              className="voice-orb-status"
              key={speaking ? 'speaking' : listening ? 'listening' : 'idle'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {speaking ? 'Speaking…' : listening ? 'Listening…' : 'Kesari is ready'}
            </motion.p>

            {/* Live transcript */}
            <AnimatePresence>
              {(listening || transcript) && (
                <motion.p
                  className="voice-orb-transcript"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {transcript || '…'}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Frequency bars */}
            <FreqBars frequencyData={frequencyData} />
          </motion.div>

          {/* Controls */}
          <motion.div
            className="voice-orb-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.button
              className={`voice-ctrl-btn ${listening ? 'listening' : ''}`}
              onClick={() => toggleListening()}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title={listening ? 'Stop listening' : 'Start listening'}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{listening ? 'Stop' : 'Speak'}</span>
            </motion.button>

            {speaking && (
              <motion.button
                className="voice-ctrl-btn stop-btn"
                onClick={stopSpeaking}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Stop speaking"
              >
                <VolumeX size={20} />
                <span>Stop</span>
              </motion.button>
            )}

            {!speaking && !listening && (
              <div className="voice-ctrl-hint">
                <Volume2 size={14} />
                <span>Tap "Read aloud" on any message to hear it here</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
