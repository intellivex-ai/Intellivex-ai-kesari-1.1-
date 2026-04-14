import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Zap, Terminal, Palette, Microscope, Layers, FileText, TrendingUp, Server, Bug } from 'lucide-react'
import { AGENTS, AGENT_ORDER, AGENT_CATEGORIES } from '../lib/agents'
import type { AgentId, AgentCategory } from '../lib/agents'

// ── Icon map (must match iconName in agents.ts) ────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Terminal, Palette, Microscope, Search, Layers,
  FileText, TrendingUp, Server, Bug,
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, active, onSelect }: {
  agent: typeof AGENTS[AgentId]
  active: boolean
  onSelect: () => void
}) {
  const Icon = ICON_MAP[agent.iconName] ?? Zap
  return (
    <motion.button
      className={`agent-card ${active ? 'agent-card-active' : ''}`}
      onClick={onSelect}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{ '--agent-color': agent.color } as React.CSSProperties}
      title={agent.description}
    >
      <div className="agent-card-icon">
        <Icon size={18} />
      </div>
      <div className="agent-card-body">
        <span className="agent-card-name">{agent.name}</span>
        <span className="agent-card-desc">{agent.description}</span>
      </div>
      {active && <div className="agent-card-active-dot" />}
    </motion.button>
  )
}

// ── AgentSelector ─────────────────────────────────────────────────────────────
interface AgentSelectorProps {
  activeAgentId: AgentId
  onSelect: (id: AgentId) => void
  compact?: boolean
}

export function AgentSelector({ activeAgentId, onSelect, compact }: AgentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<AgentCategory>('All')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  const activeAgent = AGENTS[activeAgentId]
  const Icon = ICON_MAP[activeAgent.iconName] ?? Zap

  const filtered = AGENT_ORDER
    .map(id => AGENTS[id])
    .filter(a => {
      const matchSearch = search === '' ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'All' || a.category === category
      return matchSearch && matchCat
    })

  return (
    <div className="agent-selector-wrap" ref={ref}>
      {/* Trigger */}
      {compact ? (
        // Compact mode: small button row inside plus-menu
        <div className="agent-compact-list">
          {AGENT_ORDER.slice(0, 6).map(id => {
            const a = AGENTS[id]
            const Ic = ICON_MAP[a.iconName] ?? Zap
            return (
              <button
                key={id}
                className={`agent-compact-btn ${activeAgentId === id ? 'active' : ''}`}
                style={{ '--agent-color': a.color } as React.CSSProperties}
                onClick={() => onSelect(id)}
                title={a.name}
              >
                <Ic size={13} />
                <span>{a.name}</span>
              </button>
            )
          })}
          <button className="agent-compact-btn agent-more-btn" onClick={() => setOpen(true)}>
            <Search size={13} />
            <span>More…</span>
          </button>
        </div>
      ) : (
        <motion.button
          className="agent-trigger-btn"
          onClick={() => setOpen(!open)}
          style={{ '--agent-color': activeAgent.color } as React.CSSProperties}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          title={`Active agent: ${activeAgent.name}`}
        >
          <Icon size={14} />
          <span>{activeAgent.name}</span>
        </motion.button>
      )}

      {/* Marketplace popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="agent-marketplace"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="agent-market-header">
              <span className="agent-market-title">Agent Marketplace</span>
              <button className="agent-market-close" onClick={() => setOpen(false)} title="Close">
                <X size={14} />
              </button>
            </div>

            {/* Search */}
            <div className="agent-search-wrap">
              <Search size={13} className="agent-search-icon" />
              <input
                ref={searchRef}
                className="agent-search-input"
                placeholder="Search agents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="agent-search-clear" onClick={() => setSearch('')}>
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="agent-category-tabs">
              {AGENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`agent-cat-tab ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Agent grid */}
            <div className="agent-grid">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.p
                    key="empty"
                    className="agent-grid-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No agents match "{search}"
                  </motion.p>
                ) : (
                  filtered.map(agent => (
                    <motion.div
                      key={agent.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AgentCard
                        agent={agent}
                        active={activeAgentId === agent.id}
                        onSelect={() => {
                          onSelect(agent.id)
                          setOpen(false)
                          setSearch('')
                        }}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
