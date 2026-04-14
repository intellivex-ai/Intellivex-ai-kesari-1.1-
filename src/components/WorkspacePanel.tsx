import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Terminal, Eye, FolderOpen, Play, Trash2,
  Loader2, Code2, Download, Zap
} from 'lucide-react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { indexWorkspaceFile } from '../lib/memory'
import { LiveProvider, LivePreview, LiveError } from 'react-live'

// ── Sandbox srcdoc helper ────────────────────────────────────────────────────
function getSandboxSrc(code: string, lang: string): string {
  if (lang === 'html') return code
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui, sans-serif; padding: 1.5rem; background: #0f1219; color: #e2e8f0; }
    * { box-sizing: border-box; }
  </style></head><body><script>${code.replace(/<\/script>/g, '<\\/script>')}<\/script></body></html>`
}

// ── Detect if code is React (JSX/TSX) ────────────────────────────────────────
function isReactCode(lang: string, code: string): boolean {
  const reactLangs = ['jsx', 'tsx']
  if (reactLangs.includes(lang.toLowerCase())) return true
  return code.includes('React') || code.includes('useState') || (code.includes('return (') && code.includes('<'))
}

// ── React Live Sandbox ───────────────────────────────────────────────────────
function ReactLiveSandbox({ code }: { code: string }) {
  // Strip import statements for react-live (it provides React scope)
  const cleanCode = code
    .replace(/^import\s+.*?from\s+['"][^'"]*['"]\s*;?\s*/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .trim()

  return (
    <div className="ws-react-live">
      <LiveProvider
        code={cleanCode}
        noInline={false}
      >
        <div className="ws-react-preview">
          <LivePreview />
        </div>
        <LiveError className="ws-react-error" />
      </LiveProvider>
    </div>
  )
}

// ── ZIP Export helper ─────────────────────────────────────────────────────────
async function exportAsZip(code: string, lang: string, filename?: string) {
  try {
    // Dynamically import jszip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const ext = lang === 'tsx' ? 'tsx' : lang === 'jsx' ? 'jsx' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'js'
    const name = filename || `component.${ext}`
    zip.file(name, code)
    
    if (['tsx', 'jsx', 'ts', 'js'].includes(ext)) {
      zip.file('package.json', JSON.stringify({
        name: 'intellivex-export',
        version: '1.0.0',
        dependencies: { react: '^18', 'react-dom': '^18' },
        devDependencies: { typescript: '^5', '@types/react': '^18' }
      }, null, 2))
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intellivex-export-${Date.now()}.zip`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.warn('[WorkspacePanel] ZIP export fallback:', e)
    // Fallback: download as raw file
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `export.${lang}`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// ── Terminal Output ───────────────────────────────────────────────────────────
function TerminalOutput() {
  const { sandboxOutputs, clearOutputs, isRunning } = useWorkspaceStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sandboxOutputs.length])

  return (
    <div className="ws-terminal">
      <div className="ws-terminal-bar">
        <div className="ws-terminal-dots">
          <span /><span /><span />
        </div>
        <span className="ws-terminal-title">Output</span>
        <button className="ws-icon-btn" onClick={clearOutputs} title="Clear output">
          <Trash2 size={12} />
        </button>
      </div>
      <div className="ws-terminal-body">
        {sandboxOutputs.length === 0 && !isRunning && (
          <p className="ws-terminal-empty">No output yet. Run code to see results.</p>
        )}
        {isRunning && (
          <div className="ws-terminal-running">
            <Loader2 size={12} className="spin" /> Running…
          </div>
        )}
        <AnimatePresence initial={false}>
          {sandboxOutputs.map((out, i) => (
            <motion.div
              key={i}
              className={`ws-output-line ws-output-${out.type}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
            >
              <span className="ws-output-prefix">
                {out.type === 'log' ? '▶' : out.type === 'error' ? '✗' : '✓'}
              </span>
              <span className="ws-output-text">{out.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  )
}

// ── File Explorer ─────────────────────────────────────────────────────────────
function FileExplorer() {
  const { files, activeFile, setActiveFile } = useWorkspaceStore()

  // Auto-index files into memory when opened
  useEffect(() => {
    if (activeFile) {
      const f = files.find(f => f.name === activeFile)
      if (f) indexWorkspaceFile(f.name, f.content ?? '').catch(() => { /* silent */ })
    }
  }, [activeFile, files])

  if (files.length === 0) {
    return (
      <div className="ws-files-empty">
        <FolderOpen size={28} className="ws-files-icon" />
        <p>No files yet</p>
        <span>Ask Kesari to create a project and files will appear here.</span>
      </div>
    )
  }

  return (
    <div className="ws-file-list">
      {files.map(f => (
        <button
          key={f.name}
          className={`ws-file-item ${activeFile === f.name ? 'active' : ''}`}
          onClick={() => setActiveFile(f.name)}
        >
          <Code2 size={12} />
          <span>{f.name}</span>
        </button>
      ))}
    </div>
  )
}

function WsTab({ label, icon, active, onClick, id }: {
  label: string; icon: React.ReactNode;
  active: boolean; onClick: () => void; id: string;
}) {
  return (
    <button
      id={`ws-tab-${id}`}
      className={`ws-tab ${active ? 'ws-tab-active' : ''}`}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ── Main WorkspacePanel ───────────────────────────────────────────────────────
export function WorkspacePanel() {
  const {
    open, activeTab, setTab, closeWorkspace,
    previewCode, previewLang, runCode, isRunning,
    panelWidth, setPanelWidth
  } = useWorkspaceStore()

  const [reactLiveMode, setReactLiveMode] = useState(false)
  const isReact = isReactCode(previewLang, previewCode)
  const canRun = ['js', 'javascript', 'ts', 'typescript', 'html'].includes(previewLang.toLowerCase())

  // Resizer logic
  const isDragging = useRef(false)
  const [dragging, setDragging] = useState(false)

  const startResizing = (_e: React.MouseEvent) => {
    isDragging.current = true
    setDragging(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'ew-resize'
  }

  const stopResizing = () => {
    isDragging.current = false
    setDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
    document.body.style.cursor = 'default'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100
    if (newWidth > 20 && newWidth < 85) {
      setPanelWidth(newWidth)
    }
  }

  // Sliding tab indicator logic
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  useEffect(() => {
    const activeEl = document.getElementById(`ws-tab-${activeTab}`)
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth
      })
    }
  }, [activeTab, open])

  // Auto-switch to react live mode for JSX/TSX
  useEffect(() => {
    if (isReact) setReactLiveMode(true)
    else setReactLiveMode(false)
  }, [isReact, previewCode])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="workspace-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: `${panelWidth}%`, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Resizer Handle */}
          <div 
            className={`ws-resizer ${dragging ? 'dragging' : ''}`} 
            onMouseDown={startResizing}
          />

          {/* Panel header */}
          <div className="ws-header">
            <div className="ws-tabs">
              <motion.div 
                className="ws-tab-indicator"
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
              <WsTab id="preview" label="Preview" icon={<Eye size={13} />} active={activeTab === 'preview'} onClick={() => setTab('preview')} />
              <WsTab id="terminal" label="Terminal" icon={<Terminal size={13} />} active={activeTab === 'terminal'} onClick={() => setTab('terminal')} />
              <WsTab id="files" label="Files" icon={<FolderOpen size={13} />} active={activeTab === 'files'} onClick={() => setTab('files')} />
            </div>
            <div className="ws-header-actions">
              {/* React Live toggle */}
              {previewCode && isReact && activeTab === 'preview' && (
                <button
                  className={`ws-icon-btn ws-react-toggle ${reactLiveMode ? 'active' : ''}`}
                  onClick={() => setReactLiveMode(!reactLiveMode)}
                  title={reactLiveMode ? 'Switch to iframe preview' : 'Switch to React Live'}
                >
                  <Zap size={13} />
                </button>
              )}
              {/* Export ZIP */}
              {previewCode && (
                <button
                  className="ws-icon-btn ws-export-btn"
                  onClick={() => exportAsZip(previewCode, previewLang)}
                  title="Export as ZIP"
                >
                  <Download size={14} />
                </button>
              )}
              {previewCode && canRun && !reactLiveMode && (
                <motion.button
                  className={`ws-run-btn ${isRunning ? 'running' : ''}`}
                  onClick={() => runCode(previewCode, previewLang)}
                  disabled={isRunning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isRunning ? <Loader2 size={13} className="spin" /> : <Play size={13} fill="currentColor" />}
                  <span>{isRunning ? 'Running…' : 'Run'}</span>
                </motion.button>
              )}
              <button className="ws-icon-btn ws-close-btn" onClick={closeWorkspace}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="ws-body">
            {activeTab === 'preview' && (
              previewCode ? (
                reactLiveMode ? (
                  <ReactLiveSandbox code={previewCode} />
                ) : (
                  <iframe
                    key={previewCode}
                    title="Code preview"
                    sandbox="allow-scripts allow-forms allow-popups"
                    srcDoc={getSandboxSrc(previewCode, previewLang)}
                    className="ws-iframe"
                  />
                )
              ) : (
                <div className="ws-empty-preview">
                  <div className="ws-empty-box">
                    <div className="ws-empty-ring" />
                    <Eye size={48} className="ws-empty-icon" />
                  </div>
                  <p>Studio Preview</p>
                  <span>Select a code artifact to visualize components in real-time.</span>
                </div>
              )
            )}
            {activeTab === 'terminal' && <TerminalOutput />}
            {activeTab === 'files' && <FileExplorer />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
