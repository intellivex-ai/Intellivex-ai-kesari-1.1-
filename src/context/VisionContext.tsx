import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StagedFile {
  id: string
  name: string
  type: 'image' | 'pdf' | 'text' | 'code'
  dataUrl: string
  size: number
  previewUrl?: string // for images: same as dataUrl; for PDFs: null
}

interface VisionContextValue {
  stagedFiles: StagedFile[]
  isDragging: boolean
  addFile: (file: File) => Promise<void>
  removeFile: (id: string) => void
  clearFiles: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const VisionCtx = createContext<VisionContextValue | null>(null)

export function useVision() {
  const ctx = useContext(VisionCtx)
  if (!ctx) throw new Error('useVision must be used within VisionProvider')
  return ctx
}

// ── File type helper ──────────────────────────────────────────────────────────
function getFileType(file: File): StagedFile['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.html', '.json', '.sql', '.sh', '.yaml', '.yml']
  if (codeExts.some(ext => file.name.endsWith(ext))) return 'code'
  return 'text'
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function VisionProvider({ children }: { children: ReactNode }) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  // Global drag-over detection
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current++
      if (dragCounterRef.current === 1) setIsDragging(true)
    }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) setIsDragging(false)
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onDragOver)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onDragOver)
    }
  }, [])

  const addFile = useCallback(async (file: File): Promise<void> => {
    const type = getFileType(file)
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      if (type === 'image') {
        reader.onload = e => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        reader.onload = e => {
          const text = e.target?.result as string
          // For non-images, encode as a special text marker
          resolve(`[FILE:${file.name}]\n${text.slice(0, 8000)}`)
        }
        reader.readAsText(file)
      }
    })

    const staged: StagedFile = {
      id: `file-${crypto.randomUUID()}`,
      name: file.name,
      type,
      dataUrl,
      size: file.size,
      previewUrl: type === 'image' ? dataUrl : undefined,
    }
    setStagedFiles(prev => [...prev, staged])
  }, [])

  const removeFile = useCallback((id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => setStagedFiles([]), [])

  return (
    <VisionCtx.Provider value={{ stagedFiles, isDragging, addFile, removeFile, clearFiles }}>
      {children}
    </VisionCtx.Provider>
  )
}
