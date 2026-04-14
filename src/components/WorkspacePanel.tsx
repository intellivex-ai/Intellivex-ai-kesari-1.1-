import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Terminal, Eye, FolderOpen, Play, Trash2,
  Loader2, Code2, RefreshCw,
} from 'lucide-react'
import { useWorkspaceStore } from '../stores/workspaceStore'

// ── Sandbox srcdoc helper ────────────────────────────────────────────────────
function getSandboxSrc(code: string, lang: string): string {
  if (lang === 'html') return code
  return `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui, sans-serif; padding: 1.5rem; background: #0f1219; color: #e2e8f0; }
    * { box-sizing: border-box; }
  </style></head><body><script>${code.replace(/<\/script>/g, '<\\/script>')}<\/script></body></html>`
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

// ── Tab Button ────────────────────────────────────────────────────────────────
function WsTab({ label, icon, active, onClick }: {
  label: string; icon: React.ReactNode
  active: boolean; onClick: () => void
}) {
  return (
    <button
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
  } = useWorkspaceStore()

  const canRun = ['js', 'javascript', 'ts', 'typescript', 'html'].includes(previewLang.toLowerCase())

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="workspace-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '46%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Panel header */}
          <div className="ws-header">
            <div className="ws-tabs">
              <WsTab label="Preview" icon={<Eye size={12} />} active={activeTab === 'preview'} onClick={() => setTab('preview')} />
              <WsTab label="Terminal" icon={<Terminal size={12} />} active={activeTab === 'terminal'} onClick={() => setTab('terminal')} />
              <WsTab label="Files" icon={<FolderOpen size={12} />} active={activeTab === 'files'} onClick={() => setTab('files')} />
            </div>
            <div className="ws-header-actions">
              {previewCode && canRun && (
                <motion.button
                  className={`ws-run-btn ${isRunning ? 'running' : ''}`}
                  onClick={() => runCode(previewCode, previewLang)}
                  disabled={isRunning}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  title="Run code"
                >
                  {isRunning ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
                  {isRunning ? 'Running…' : 'Run'}
                </motion.button>
              )}
              {previewCode && (
                <button
                  className="ws-icon-btn"
                  onClick={() => setTab('preview')}
                  title="Refresh preview"
                >
                  <RefreshCw size={12} />
                </button>
              )}
              <button className="ws-icon-btn ws-close-btn" onClick={closeWorkspace} title="Close workspace">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="ws-body">
            {activeTab === 'preview' && (
              previewCode ? (
                <iframe
                  key={previewCode}
                  title="Code preview"
                  sandbox="allow-scripts allow-forms allow-popups"
                  srcDoc={getSandboxSrc(previewCode, previewLang)}
                  className="ws-iframe"
                />
              ) : (
                <div className="ws-empty-preview">
                  <Eye size={32} className="ws-empty-icon" />
                  <p>No preview yet</p>
                  <span>Click "Preview" on any code block to render it here.</span>
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
