import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Zap, Terminal, Palette, Microscope, Search, Layers } from 'lucide-react'
import { AGENTS, AGENT_ORDER } from '../lib/agents'
import type { AgentId } from '../lib/agents'

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Terminal, Palette, Microscope, Search, Layers
}

interface AgentSelectorProps {
  activeAgentId: AgentId
  onSelect: (id: AgentId) => void
  compact?: boolean
}

export function AgentSelector({ activeAgentId, onSelect, compact = false }: AgentSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const agent = AGENTS[activeAgentId]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="agent-selector-wrap" ref={ref}>
      <button
        className={`agent-selector-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title={`Active agent: ${agent.label}`}
      >
        <span className={`agent-emoji agent-color-${activeAgentId}`}>
          {(() => {
            const IconComponent = ICON_MAP[agent.iconName] || Zap
            return <IconComponent size={14} />
          })()}
        </span>
        {!compact && <span className="agent-name">{compact ? '' : agent.name}</span>}
        <ChevronDown size={11} className={`agent-chevron ${open ? 'rotated' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="agent-popover"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="agent-popover-title">Choose Agent</p>
            <div className="agent-list">
              {AGENT_ORDER.map(id => {
                const a = AGENTS[id]
                return (
                  <button
                    key={id}
                    className={`agent-option ${activeAgentId === id ? 'active' : ''} agent-color-${id}`}
                    onClick={() => { onSelect(id); setOpen(false) }}
                  >
                    <span className="agent-option-emoji">
                      {(() => {
                        const IconComponent = ICON_MAP[a.iconName] || Zap
                        return <IconComponent size={16} />
                      })()}
                    </span>
                    <div className="agent-option-info">
                      <span className="agent-option-name">{a.label}</span>
                      <span className="agent-option-desc">{a.description}</span>
                    </div>
                    {activeAgentId === id && <Check size={12} className="agent-check" />}
                  </button>
                )
              })}
            </div>
            <p className="agent-tip">
              💡 Tip: Type <kbd>@coder</kbd>, <kbd>@designer</kbd> etc. to invoke inline
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
