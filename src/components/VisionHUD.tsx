import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileImage, FileText, Code2, X } from 'lucide-react'
import { useVision } from '../context/VisionContext'

// ── File icon helper ──────────────────────────────────────────────────────────
function FileTypeIcon({ type }: { type: string }) {
  if (type === 'image') return <FileImage size={16} />
  if (type === 'code') return <Code2 size={16} />
  return <FileText size={16} />
}

// ── Thumbnail Card ────────────────────────────────────────────────────────────
function ThumbnailCard({ file, onRemove }: {
  file: { id: string; name: string; type: string; previewUrl?: string; size: number }
  onRemove: () => void
}) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <motion.div
      className="vision-thumbnail"
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {file.previewUrl ? (
        <img src={file.previewUrl} alt={file.name} className="vision-thumb-img" />
      ) : (
        <div className="vision-thumb-icon">
          <FileTypeIcon type={file.type} />
        </div>
      )}
      <div className="vision-thumb-meta">
        <span className="vision-thumb-name">{file.name.length > 18 ? file.name.slice(0, 15) + '…' : file.name}</span>
        <span className="vision-thumb-size">{formatSize(file.size)}</span>
      </div>
      <button className="vision-thumb-remove" onClick={onRemove} title="Remove file">
        <X size={10} />
      </button>
    </motion.div>
  )
}

// ── Vision HUD ────────────────────────────────────────────────────────────────
export function VisionHUD() {
  const { isDragging, stagedFiles, addFile, removeFile } = useVision()
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files ?? [])
    for (const file of files) {
      await addFile(file)
    }
  }, [addFile])

  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    el.addEventListener('drop', handleDrop)
    return () => el.removeEventListener('drop', handleDrop)
  }, [handleDrop])

  return (
    <>
      {/* Full-screen drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            ref={dropZoneRef}
            className="vision-hud-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="vision-drop-zone"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Upload size={48} className="vision-drop-icon" />
              </motion.div>
              <p className="vision-drop-title">Drop files to analyze</p>
              <p className="vision-drop-sub">Images, PDFs, code files — Kesari will analyze them</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staged file thumbnails — rendered inside InputArea via portal target */}
      {stagedFiles.length > 0 && (
        <div className="vision-staged-row">
          <AnimatePresence>
            {stagedFiles.map(f => (
              <ThumbnailCard
                key={f.id}
                file={f}
                onRemove={() => removeFile(f.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

// ── Input-area thumbnail strip (inline chips) ─────────────────────────────────
export function VisionChips() {
  const { stagedFiles, removeFile } = useVision()
  if (stagedFiles.length === 0) return null
  return (
    <div className="vision-chips-row">
      <AnimatePresence>
        {stagedFiles.map(f => (
          <motion.div
            key={f.id}
            className="vision-chip"
            initial={{ opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {f.previewUrl ? (
              <img src={f.previewUrl} alt={f.name} className="vision-chip-img" />
            ) : (
              <span className="vision-chip-icon"><FileTypeIcon type={f.type} /></span>
            )}
            <span className="vision-chip-name">{f.name.length > 14 ? f.name.slice(0, 11) + '…' : f.name}</span>
            <button onClick={() => removeFile(f.id)} className="vision-chip-remove" title="Remove">
              <X size={9} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
