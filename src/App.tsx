import { useState, useRef, useEffect, useCallback, createContext, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser, UserButton as ClerkUserButton } from "@clerk/clerk-react";
import {
  Search, Trash2, Edit3, Settings, Send, Copy, Check,
  MessageSquare, X, Menu, Sun, Moon, RotateCcw, Loader2,
  Square, Download, Mic, MicOff, Paperclip, ChevronDown,
  Sparkles, Palette, AlertCircle, Plus,
  Volume2, VolumeX, Globe,
  ImageIcon, ThumbsUp, ThumbsDown, MoreHorizontal, PanelLeft, ArrowDown,
  Code2, Zap, Terminal, PanelLeftClose, LayoutPanelLeft,
  BrainCircuit, ChevronRight, Microscope, Layers, Radio,
} from "lucide-react";
import { useChatContext, AVAILABLE_MODELS, isImageRequest } from "./context/ChatContext";
import type { UIMessage, UIChat } from "./context/ChatContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { IntellivexLogo } from "./components/Logo";
import { WorkspacePanel } from "./components/WorkspacePanel";
import { AgentSelector } from "./components/AgentSelector";
import { VisionHUD, VisionChips } from "./components/VisionHUD";
import { VoiceOrb } from "./components/VoiceOrb";
import { useWorkspaceStore } from "./stores/workspaceStore";
import { VisionProvider, useVision } from "./context/VisionContext";
import { VoiceProvider, useVoice } from "./context/VoiceContext";
import { AGENTS } from "./lib/agents";
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider, useToast } from "./context/ToastContext";
import { CodeBlock } from "./components/CodeBlock";



const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Terminal, Palette, Microscope, Search, Layers
}


// ── Shared Contexts ────────────────────────────────────────────────────────────
export const ArtifactCtx = createContext<(code: string, lang: string) => void>(() => { });

// ── Suggestions ───────────────────────────────────────────────────────────────
// ── Image style definitions ────────────────────────────────────────────────────
const IMAGE_STYLES = [
  { id: 'realistic', label: 'Realistic', emoji: '📸' },
  { id: 'anime', label: 'Anime', emoji: '🎌' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { id: 'digital art', label: 'Digital Art', emoji: '🎨' },
] as const;
type ImageStyleId = typeof IMAGE_STYLES[number]['id'];

function renderInline(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    else out.push(<code key={i++} className="inline-code">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

// ── Markdown table ────────────────────────────────────────────────────────────
// Bolt optimization: Removed memo here because TextBlock creates `tableLines` on the fly,
// so the reference always changes, making memoization ineffective overhead. TextBlock is already memoized.
function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines.map(l => l.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
  const header = rows[0];
  // row[1] is the separator — skip it
  const body = rows.slice(2);
  return (
    <div className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>{header.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Text block (handles headings, lists, tables, paragraphs) ─────────────────
// Bolt optimization: Wrapped in React.memo so that static text blocks in long messages
// don't re-render and re-parse while the AI is streaming new tokens at the end.
const TextBlock = memo(function TextBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let numItems: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let liKey = 0;

  const flushList = () => {
    if (listItems.length) { out.push(<ul key={`ul-${liKey++}`}>{listItems}</ul>); listItems = []; }
    if (numItems.length) { out.push(<ol key={`ol-${liKey++}`}>{numItems}</ol>); numItems = []; }
  };
  const flushTable = () => {
    if (tableLines.length >= 3) { out.push(<MarkdownTable key={`tbl-${liKey++}`} lines={tableLines} />); }
    tableLines = [];
  };

  lines.forEach((line, i) => {
    const isTableRow = /^\|.+\|$/.test(line.trim());
    if (isTableRow) { flushList(); tableLines.push(line); return; }
    if (tableLines.length) { flushTable(); }

    if (line.startsWith("### ")) { flushList(); out.push(<h3 key={i}>{renderInline(line.slice(4))}</h3>); }
    else if (line.startsWith("## ")) { flushList(); out.push(<h2 key={i}>{renderInline(line.slice(3))}</h2>); }
    else if (line.startsWith("# ")) { flushList(); out.push(<h1 key={i}>{renderInline(line.slice(2))}</h1>); }
    else if (/^\d+\.\s/.test(line)) { numItems.push(<li key={i}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>); }
    else if (line.startsWith("- ") || line.startsWith("* ")) { listItems.push(<li key={i}>{renderInline(line.slice(2))}</li>); }
    else if (line.trim() === "---") { flushList(); out.push(<hr key={i} className="md-hr" />); }
    else if (line.startsWith("> ")) { flushList(); out.push(<blockquote key={i}>{renderInline(line.slice(2))}</blockquote>); }
    else if (line.trim() === "") { flushList(); out.push(<div key={i} className="md-spacer" />); }
    else { flushList(); out.push(<p key={i}>{renderInline(line)}</p>); }
  });
  flushList();
  flushTable();
  return <>{out}</>;
});

// Bolt optimization: Memoized to prevent re-rendering of thought blocks during streaming.
const ThoughtBlock = memo(function ThoughtBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`thought-block ${open ? 'open' : ''}`}>
      <button className="thought-toggle" onClick={() => setOpen(!open)}>
        <BrainCircuit size={14} className="thought-icon" />
        <span>Inner Monologue</span>
        <ChevronRight size={14} className="thought-chevron" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="thought-content-wrap"
          >
            <div className="thought-content">
              {content.trim().split("\n").map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Bolt optimization: Memoized to prevent re-rendering of tool blocks during streaming.
const ToolBlock = memo(function ToolBlock({ content, name }: { content: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const { runCode } = useWorkspaceStore();

  let parsedCode = '';
  let canRun = false;
  if (name === 'execute_python') {
    try {
      const args = JSON.parse(content);
      parsedCode = args.code || '';
      canRun = !!parsedCode;
    } catch { /* json not fully streamed yet */ }
  }

  return (
    <div className={`thought-block tool-block-container ${open ? 'open' : ''}`}>
      <button className="thought-toggle tool-block-toggle" onClick={() => setOpen(!open)}>
        <Code2 size={14} className="thought-icon" />
        <span>Executing {name || 'Tool'}</span>
        <ChevronRight size={14} className="thought-chevron" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="thought-content-wrap"
          >
            <div className="thought-content">
              {canRun && (
                <div className="tool-block-run-wrap">
                  <button 
                    onClick={() => runCode(parsedCode, 'python')}
                    className="tool-block-run-btn"
                  >
                    <Terminal size={12} /> Run Script
                  </button>
                </div>
              )}
              <pre className="inline-code tool-block-code">
                {canRun ? parsedCode : content.trim()}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Bolt optimization: Memoized to prevent re-rendering the entire markdown body if the content hasn't changed.
const MarkdownBody = memo(function MarkdownBody({ content }: { content: string }) {
  const nodes: React.ReactNode[] = [];
  
  // Extract both thought blocks and tool blocks safely
  const blockRe = /<(think|thought|tool)(?:\s+name="([^"]*)")?>([\s\S]*?)(?:<\/\1>|$)/g;
  let textSegments = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(content)) !== null) {
    const beforeSegment = content.slice(lastIndex, m.index);
    if (beforeSegment) textSegments.push({ type: 'text', content: beforeSegment });
    
    const blockType = m[1] === 'tool' ? 'tool' : 'thought';
    const blockName = m[2]; // Captures name="" for tool
    const blockContent = m[3];
    
    textSegments.push({ type: blockType, content: blockContent, name: blockName });
    lastIndex = m.index + m[0].length;
  }
  
  const afterSegment = content.slice(lastIndex);
  if (afterSegment) textSegments.push({ type: 'text', content: afterSegment });

  let key = 0;
  for (const seg of textSegments) {
    if (seg.type === 'thought') {
      nodes.push(<ThoughtBlock key={key++} content={seg.content} />);
    } else if (seg.type === 'tool') {
      nodes.push(<ToolBlock key={key++} content={seg.content} name={seg.name} />);
    } else {
      const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
      let last = 0; let m: RegExpExecArray | null;
      while ((m = codeRe.exec(seg.content)) !== null) {
        const before = seg.content.slice(last, m.index);
        if (before.trim()) nodes.push(<TextBlock key={key++} text={before} />);
        nodes.push(<CodeBlock key={key++} lang={m[1]} code={m[2].trim()} />);
        last = m.index + m[0].length;
      }
      const after = seg.content.slice(last);
      if (after.trim()) nodes.push(<TextBlock key={key++} text={after} />);
    }
  }

  return <div className="md-content">{nodes}</div>;
});

// ── Waveform typing indicator ─────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="waveform">
        {[0, 1, 2, 3, 4].map(i => {
          return <span key={i} className="wave-bar" />;
        })}
      </div>
      <motion.span
        className="typing-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        Kesari is thinking…
      </motion.span>
    </div>
  );
}

// ── Image Skeleton (generating placeholder) ───────────────────────────────────
function ImageSkeleton({ prompt }: { prompt: string }) {
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 1.8 + 0.4;
      if (p > 88) p = 88;
      if (progressRef.current) {
        progressRef.current.style.width = `${p}%`;
      }
    }, 500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="img-skeleton-wrap">
      <div className="img-skeleton">
        <div className="img-skeleton-shimmer" />
        <div className="img-skeleton-content">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <Sparkles size={28} className="img-gen-icon" />
          </motion.div>
          <p className="img-gen-label">Generating image…</p>
          {prompt && <p className="img-gen-prompt">{prompt.slice(0, 80)}{prompt.length > 80 ? '…' : ''}</p>}
        </div>
      </div>
      <div className="img-progress-track">
        <div ref={progressRef} className="img-progress-bar" />
      </div>
    </div>
  );
}

// ── Image Message (completed image + actions) ─────────────────────────────────
function ImageMessage({ msg, onRegenerate }: { msg: UIMessage; onRegenerate: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (!msg.image_url || downloading) return;
    setDownloading(true);
    try {
      const r = await fetch(msg.image_url);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `intellivex-${Date.now()}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setDownloading(false); }
  };

  return (
    <div className="img-message">
      <div className="img-preview-wrap">
        {!loaded && <div className="img-preview-placeholder"><ImageIcon size={24} /></div>}
        <img
          src={msg.image_url ?? ''}
          alt={msg.content ?? 'Generated image'}
          className={`img-preview ${loaded ? 'img-preview-loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      </div>
      {msg.content && (
        <p className="img-caption">
          <Sparkles size={11} />
          {msg.content.slice(0, 120)}{(msg.content.length > 120) ? '…' : ''}
        </p>
      )}
      <div className="img-actions">
        <button className="img-action-btn" onClick={download} disabled={downloading} title="Download image">
          {downloading ? <Loader2 size={12} className="spin" /> : <Download size={12} />}
          {downloading ? 'Saving…' : 'Download'}
        </button>
        <button className="img-action-btn" onClick={onRegenerate} title="Generate new variation">
          <RotateCcw size={12} /> Regenerate
        </button>
      </div>
    </div>
  );
}

// ── Style Picker ──────────────────────────────────────────────────────────────
function StylePicker({ selected, onSelect, isImageMode, usage }: {
  selected: ImageStyleId | null;
  onSelect: (s: ImageStyleId | null) => void;
  isImageMode: boolean;
  usage?: { used: number; limit: number };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="style-picker-wrap" ref={ref}>
      <button
        type="button"
        className={`input-icon-btn ${isImageMode ? 'style-picker-active' : ''} ${selected ? 'style-selected-btn' : ''}`}
        onClick={() => setOpen(!open)}
        title={selected ? `Style: ${selected}` : 'Image style'}
      >
        <Palette size={15} />
        {selected && <span className="style-dot" />}
      </button>
      {open && (
        <div className="style-popover">
          <p className="style-popover-title">Image Style</p>
          <div className="style-options">
            {IMAGE_STYLES.map(s => (
              <button
                key={s.id}
                className={`style-option ${selected === s.id ? 'style-option-active' : ''}`}
                onClick={() => { onSelect(selected === s.id ? null : s.id); setOpen(false); }}
              >
                <span>{s.emoji}</span><span>{s.label}</span>
              </button>
            ))}
            {selected && (
              <button className="style-option style-option-clear" onClick={() => { onSelect(null); setOpen(false); }}>
                <span>✕</span><span>Clear style</span>
              </button>
            )}
          </div>
          {usage && (
            <p className={`img-limit-badge ${usage.used >= usage.limit ? 'img-limit-full' : ''}`}>
              {usage.used}/{usage.limit} images today
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Message reactions ─────────────────────────────────────────────────────────
function Reactions({ reaction, onReact }: {
  reaction?: "up" | "down" | null; onReact: (r: "up" | "down" | null) => void;
}) {
  return (
    <div className="reactions">
      <button
        className={`reaction-btn ${reaction === "up" ? "active-up" : ""}`}
        onClick={() => onReact(reaction === "up" ? null : "up")}
        title="Good response"
      >
        <ThumbsUp size={12} />
      </button>
      <button
        className={`reaction-btn ${reaction === "down" ? "active-down" : ""}`}
        onClick={() => onReact(reaction === "down" ? null : "down")}
        title="Bad response"
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  );
}

// ── Message Row ───────────────────────────────────────────────────────────────
const MessageRow = memo(function MessageRow({ msg, onRegenerate, onRegenerateImage, isLast, streaming, onReact, onBranchChat }: {
  msg: UIMessage;
  onRegenerate?: () => void;
  onRegenerateImage?: (prompt: string, style?: string, id?: string) => void;
  isLast?: boolean;
  streaming?: boolean;
  onReact: (r: "up" | "down" | null) => void;
  onBranchChat?: (id: string, text: string) => void;
}) {
  const isUser = msg.role === "user";
  const isImage = msg.type === "image";
  const isStreaming = msg.streaming;
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(msg.content);
  const [playingTTS, setPlayingTTS] = useState(false);
  const toast = useToast();

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    toast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  let voice: ReturnType<typeof useVoice> | null = null;
  try { voice = useVoice(); } catch { /* VoiceProvider not mounted yet */ }

  const toggleTTS = () => {
    if (playingTTS) {
      voice?.stopSpeaking();
      window.speechSynthesis.cancel();
      setPlayingTTS(false);
    } else {
      setPlayingTTS(true);
      if (voice) {
        voice.speakText(msg.content);
        // Track speaking state
        const check = setInterval(() => {
          if (!voice?.speaking) { setPlayingTTS(false); clearInterval(check); }
        }, 500);
      } else {
        const u = new SpeechSynthesisUtterance(msg.content);
        u.onend = () => setPlayingTTS(false);
        u.onerror = () => setPlayingTTS(false);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const handleEditSave = () => {
    if (editVal.trim() !== msg.content && onBranchChat) {
      onBranchChat(msg.id, editVal.trim());
    }
    setEditing(false);
  };

  // Extract <mode> tag if present (skill mode UI)
  let activeMode = null;
  let displayContent = msg.content;
  if (!isUser && !isImage) {
    const modeMatch = displayContent.match(/^<mode>([\w\s]*)(?:<\/mode>)?/i);
    if (modeMatch) {
      activeMode = modeMatch[1];
      displayContent = displayContent.slice(modeMatch[0].length).trimStart();
    }
  }


  return (
    <motion.div
      className={`message-row ${isUser ? "user-row" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className="message-inner">
        <div
          className={`msg-avatar ${isUser ? 'user' : 'ai'} ${isStreaming ? 'avatar-streaming' : ''} ${!isUser && msg.agentId && msg.agentId !== 'kesari' ? `agent-color-${msg.agentId} agent-border-ring` : ''}`}
        >
          {isUser ? 'Y' : (msg.agentId && msg.agentId !== 'kesari')
            ? <span className="agent-avatar-emoji">
                {(() => {
                  const Icon = ICON_MAP[AGENTS[msg.agentId].iconName] || Zap;
                  return <Icon size={24} />;
                })()}
              </span>
            : <IntellivexLogo size={64} />}
        </div>
        <div className="msg-body">
          {!isUser && (
            <div className="msg-author">
              {msg.agentId && msg.agentId !== 'kesari'
                ? <><span className={`agent-color-${msg.agentId} agent-text`}>{AGENTS[msg.agentId].name}</span></>
                : <span className="ai-label">Kesari 1.2</span>}
              {activeMode && <span className="mode-badge"><Zap size={10} /> {activeMode}</span>}
            </div>
          )}

          {/* ── Render logic ───────────────────────────────── */}
          {msg.streaming && displayContent === "" && !activeMode ? (
            <TypingIndicator />
          ) : msg.error ? (
            <div className="msg-error">
              <AlertCircle size={13} />
              <span>{displayContent || (isImage ? 'Image generation failed.' : 'Something went wrong. Please try again.')}</span>
              {onRegenerate && (
                <button className="msg-action" onClick={onRegenerate}><RotateCcw size={11} /> Retry</button>
              )}
            </div>
          ) : isImage ? (
            msg.image_generating ? (
              <ImageSkeleton prompt={displayContent} />
            ) : msg.image_url ? (
              <ImageMessage
                msg={{...msg, content: displayContent}}
                onRegenerate={() => onRegenerateImage?.(displayContent, msg.image_style, msg.id)}
              />
            ) : null
          ) : isUser ? (
            editing ? (
              <div className="user-bubble user-bubble-editing">
                <textarea
                  className="edit-textarea"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  rows={3}
                  autoFocus
                  title="Edit message content"
                  aria-label="Edit message content"
                  placeholder="Update your message..."
                />
                <div className="edit-actions">
                  <button className="edit-btn save-btn" onClick={handleEditSave}>Save & Submit</button>
                  <button className="edit-btn cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="user-bubble">{displayContent}</div>
            )
          ) : (
            <motion.div 
              className={msg.streaming ? "stream-active" : ""}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
            >
              <MarkdownBody content={displayContent} />
              {msg.streaming && displayContent && (
                <span className="stream-cursor" aria-hidden />
              )}
            </motion.div>
          )}

          {/* ── Footer Actions (Icon Only) ── */}
          {!msg.streaming && !msg.error && !msg.image_generating && (
            <div className="msg-footer">
              <div className="msg-footer-left">
                {!isImage && (
                  <button onClick={copy} className={`msg-action-icon ${copied ? "active" : ""}`} title="Copy message">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
                {!isUser && !isImage && (
                  <button onClick={toggleTTS} className={`msg-action-icon ${playingTTS ? "active" : ""}`} title={playingTTS ? "Stop reading" : "Read aloud"}>
                    <Volume2 size={14} className={playingTTS ? "playing" : ""} />
                  </button>
                )}
                {!isUser && isLast && !streaming && !isImage && onRegenerate && (
                  <button onClick={onRegenerate} className="msg-action-icon" title="Regenerate response">
                    <RotateCcw size={14} />
                  </button>
                )}
                {isUser && !editing && (
                  <button onClick={() => { setEditVal(msg.content); setEditing(true); }} className="msg-action-icon" title="Edit message">
                    <Edit3 size={14} />
                  </button>
                )}
                {!isUser && !isImage && (
                  <Reactions reaction={msg.reaction} onReact={onReact} />
                )}
              </div>
              <span className="msg-timestamp">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ── Empty State (audio-reactive) ──────────────────────────────────────────────
function EmptyState() {
  let voice: ReturnType<typeof useVoice> | null = null;
  try { voice = useVoice(); } catch { /* not mounted */ }
  const { frequencyData, speaking } = voice ?? { frequencyData: null, speaking: false };

  // Compute glow amplitude from frequency data
  const avgAmp = frequencyData
    ? Array.from(frequencyData.slice(0, 8)).reduce((s, v) => s + v, 0) / 8 / 255
    : 0;
  const glowSize = speaking ? 8 + avgAmp * 40 : 20;
  const glowOpacity = speaking ? 0.2 + avgAmp * 0.5 : 0.3;

  return (
    <motion.div 
      className="empty-state"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="empty-logo"
        animate={speaking
          ? { filter: `drop-shadow(0 0 ${glowSize}px rgba(16,185,129,${glowOpacity}))` }
          : {
              y: [0, -10, 0],
              filter: ["drop-shadow(0 0 0px rgba(16,185,129,0))", "drop-shadow(0 0 20px rgba(16,185,129,0.3))", "drop-shadow(0 0 0px rgba(16,185,129,0))"]
            }
        }
        transition={speaking
          ? { duration: 0.08, ease: "linear" }
          : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <IntellivexLogo size={100} />
      </motion.div>
      <motion.h1
        className="empty-title"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Hello! How can I assist you today?
      </motion.h1>
      <motion.p
        className="empty-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Kesari 1.2 · Intellivex AI Studio
      </motion.p>
    </motion.div>
  );
}

// ── Voice input hook (delegates to VoiceContext) ─────────────────────────────
function useVoiceInput(onResult: (t: string) => void) {
  let voice: ReturnType<typeof useVoice> | null = null;
  try { voice = useVoice(); } catch { /* not mounted */ }
  const { listening = false, toggleListening } = voice ?? {};
  const toggle = useCallback(() => {
    if (toggleListening) {
      toggleListening(onResult);
    } else {
      // Raw fallback
      const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (!SR) { alert("Voice input not supported in this browser."); return; }
      const rec = new SR();
      rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
      rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
      rec.start();
    }
  }, [toggleListening, onResult]);
  return { listening, toggle };
}

// ── Input Area ────────────────────────────────────────────────────────────────
const IMAGE_INPUT_RE = /\b(generate|create|draw|make|render|paint|sketch|design)\b|\b(image|photo|picture|art)\s+of\b/i;

function InputArea({ onSend, disabled, onStop, imageUsage }: {
  onSend: (t: string, style?: string, attachments?: string[]) => void;
  disabled: boolean;
  onStop: () => void;
  imageUsage?: { used: number; limit: number };
}) {
  const [value, setValue] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyleId | null>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [showAgentPopover, setShowAgentPopover] = useState(false);
  const { webSearchEnabled, setWebSearchEnabled, activeAgentId, setActiveAgentId } = useChatContext();
  const { stagedFiles, addFile, clearFiles } = useVision();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const isImageMode = IMAGE_INPUT_RE.test(value) || isImageRequest(value);

  const charCount = value.length;
  const nearLimit = charCount > 3500;
  const charPct = Math.min(charCount / 4000, 1);
  const circumference = 2 * Math.PI * 10; // r=10
  const strokeDash = circumference * charPct;

  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.style.setProperty("--stroke-dash", `${strokeDash} ${circumference}`);
    }
  }, [strokeDash, circumference]);

  const handleVoiceResult = useCallback((t: string) => {
    setValue(prev => prev ? prev + " " + t : t);
    ref.current?.focus();
  }, []);
  const { listening, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const send = () => {
    const allAttachments = stagedFiles.map(f => f.dataUrl);
    if (!value.trim() && allAttachments.length === 0) return;
    if (disabled) return;
    onSend(value.trim(), imageStyle ?? undefined, allAttachments.length > 0 ? allAttachments : undefined);
    setValue("");
    clearFiles();
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await Promise.all(files.map(file => addFile(file)));
    ref.current?.focus();
    e.target.value = "";
  };

  // @ trigger: show agent popover
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValue(val);
    resize();
    // Show agent popover when @ is typed at start
    if (val.startsWith('@') && !val.includes(' ')) {
      setShowAgentPopover(true);
    } else {
      setShowAgentPopover(false);
    }
  };

  // Variables used for ref update above

  return (
    <div className="input-area">
      {/* Agent @ popover */}
      <AnimatePresence>
        {showAgentPopover && (
          <motion.div
            className="at-agent-popover"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <p className="at-popover-label">Switch agent</p>
            <AgentSelector
              activeAgentId={activeAgentId}
              onSelect={(id) => {
                setActiveAgentId(id);
                setValue('@' + id + ' ');
                setShowAgentPopover(false);
                ref.current?.focus();
              }}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="input-wrap">
        {/* Vision Chips (staged files) */}
        <VisionChips />
        <div className={`input-box pill-box ${listening ? "listening" : ""} ${disabled ? "streaming-active" : ""} ${isImageMode ? "image-mode" : ""} ${stagedFiles.length > 0 ? "has-attachments" : ""}`}>
          <div className="plus-menu-wrap" ref={plusMenuRef}>
            <button
              type="button"
              className={`input-icon-btn plus-btn ${plusMenuOpen ? "active" : ""}`}
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              title="More actions"
            >
              <Plus size={18} style={{ transform: plusMenuOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            <AnimatePresence>
              {plusMenuOpen && (
                <motion.div
                  className="plus-menu"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button className="menu-item" onClick={() => { fileRef.current?.click(); setPlusMenuOpen(false); }}>
                    <Paperclip size={14} /> <span>Attach file</span>
                  </button>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    <span className="menu-section-label">Agent</span>
                    <AgentSelector activeAgentId={activeAgentId} onSelect={(id) => { setActiveAgentId(id); setPlusMenuOpen(false); }} compact />
                  </div>
                  <div className="menu-divider" />
                  <button className={`menu-item ${webSearchEnabled ? 'active' : ''}`} onClick={() => { setWebSearchEnabled(!webSearchEnabled); setPlusMenuOpen(false); }}>
                    <Globe size={14} /> <span>Web Search</span>
                    <div className={webSearchEnabled ? "dot active" : "dot"} />
                  </button>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    <span className="menu-section-label">Image Style</span>
                    <StylePicker
                      selected={imageStyle}
                      onSelect={setImageStyle}
                      isImageMode={true}
                      usage={imageUsage}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input ref={fileRef} type="file" className="file-input-hidden" title="Attach file" multiple
            accept="image/*,.pdf,.txt,.md,.py,.js,.ts,.tsx,.jsx,.json,.csv,.html,.css,.yaml,.yml,.sh,.sql"
            onChange={handleFileChange}
          />
          
          <textarea
            ref={ref}
            value={value}
            onChange={handleTextChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? "🎤 Listening…" : isImageMode ? "Describe your image…" : stagedFiles.length > 0 ? "Ask about these files…" : "Ask anything… or type @ for agents"}
            rows={1}
          />

          <div className="input-right-actions">
            {nearLimit && <span className="char-count">{charCount}</span>}
            <button type="button" className={`input-icon-btn ${listening ? "active-mic" : ""}`}
              title="Voice input" onClick={toggleVoice}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {disabled ? (
              <motion.button onClick={onStop} className="send-btn stop-btn" title="Stop"
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                <Square size={13} strokeWidth={3} />
              </motion.button>
            ) : (
              <div className="send-btn-wrap">
                {charCount > 100 && (
                  <svg className="char-ring" viewBox="0 0 24 24" width="36" height="36">
                    <circle cx="12" cy="12" r="10" className="char-ring-bg" />
                    <circle
                      ref={ringRef}
                      cx="12"
                      cy="12"
                      r="10"
                      className={`char-ring-fill ${nearLimit ? 'ring-warn' : ''}`}
                    />
                  </svg>
                )}
                <motion.button onClick={send} disabled={!value.trim() && stagedFiles.length === 0} className="send-btn" title="Send message"
                  whileHover={value.trim() || stagedFiles.length > 0 ? { scale: 1.08 } : {}} 
                  whileTap={value.trim() || stagedFiles.length > 0 ? { scale: 0.92 } : {}}>
                  {isImageMode ? <Sparkles size={14} /> : <Send size={14} />}
                </motion.button>
              </div>
            )}
          </div>
        </div>
        <p className="input-hint">
          {isImageMode
            ? <><span className="img-mode-hint">✦ Image mode</span> · Select a style with <Palette size={10} /></>
            : <><kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line · <kbd>@</kbd> for agents</>
          }
          {listening && <motion.span className="voice-hint" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>🔴 Recording</motion.span>}
        </p>
      </div>
    </div>
  );
}

// ── Export chat ────────────────────────────────────────────────────────────────
function exportChat(messages: UIMessage[], title: string, format: "md" | "txt") {
  const lines: string[] = [`# ${title}\n`];
  messages.forEach(m => {
    const author = m.role === "user" ? "**You**" : "**Kesari 1.2**";
    lines.push(format === "md" ? `### ${author}\n${m.content}\n` : `[${m.role === "user" ? "You" : "Kesari"}]\n${m.content}\n`);
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title.slice(0, 40).replace(/[^a-z0-9]/gi, "_")}.${format}`; a.click();
  URL.revokeObjectURL(url);
}

// ── Settings Modal ─────────────────────────────────────────────────────────────
function SettingsModal({ open, onClose, darkMode, onToggleDark, onClearChats, selectedModel, onModelChange, systemPrompt, onSystemPromptChange }: {
  open: boolean; onClose: () => void; darkMode: boolean; onToggleDark: () => void;
  onClearChats: () => void; selectedModel: string; onModelChange: (m: string) => void;
  systemPrompt: string; onSystemPromptChange: (p: string) => void;
}) {
  const [tab, setTab] = useState<"general" | "persona" | "about">("general");
  const DEFAULT_PROMPT = `You are Kesari 1.2, a studio-grade AI assistant designed by Intellivex AI.
Your responses should be elite, concise, and highly insightful.
- Avoid generic pleasantries or apologies.
- Use sophisticated, clear vocabulary.
- Structure complex data with elegant formatting (minimal headers, glass-style blocks).
- Provide robust, modular solutions when asked for code.
- Your tone is professional, helpful, and intellectually confident.`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal wide-modal" initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Settings</span>
              <button onClick={onClose} className="modal-close" title="Close"><X size={15} /></button>
            </div>
            {/* Tabs */}
            <div className="modal-tabs">
              {(["general", "persona", "about"] as const).map(t => (
                <button key={t} className={`modal-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="modal-body">
              {tab === "general" && (
                <>
                  {/* Appearance */}
                  <div className="setting-row">
                    <div>
                      <h2 className="setting-label">Appearance</h2>
                      <p className="setting-sublabel">{darkMode ? "Dark mode" : "Light mode"}</p>
                    </div>
                    <button onClick={onToggleDark} className="toggle-btn">
                      {darkMode ? <Moon size={13} /> : <Sun size={13} />}
                      {darkMode ? "Dark" : "Light"}
                    </button>
                  </div>
                  {/* Model */}
                  <div className="setting-row setting-row-col" aria-label="AI Model selection">
                    <div className="kesari-badge-row">
                      <div className="kesari-dot" />
                      <h3 className="kesari-name">AI Model</h3>
                      <span className="kesari-status">Active</span>
                    </div>
                    <div className="model-select-wrap">
                      <select className="model-select" value={selectedModel} onChange={e => onModelChange(e.target.value)} title="Select AI Model">
                        {AVAILABLE_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.label} · {m.provider}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="select-chevron" />
                    </div>
                  </div>
                  {/* Danger */}
                  <div className="modal-danger-section">
                    <button onClick={() => { onClearChats(); onClose(); }} className="danger-btn">
                      Clear all conversations
                    </button>
                  </div>
                </>
              )}
              {tab === "persona" && (
                <div className="persona-editor-wrap">
                  <h2 className="setting-label">Custom System Prompt</h2>
                  <p className="setting-sublabel">Override Kesari’s default instructions. Leave blank to use the built-in personality.</p>
                  <textarea
                    className="system-prompt-editor"
                    value={systemPrompt}
                    onChange={e => onSystemPromptChange(e.target.value)}
                    placeholder={DEFAULT_PROMPT}
                    rows={10}
                  />
                  <div className="persona-actions">
                    <button className="toggle-btn persona-reset-btn" onClick={() => onSystemPromptChange("")}>
                      Reset to default
                    </button>
                  </div>
                </div>
              )}
              {tab === "about" && (
                <div className="about-tab">
                  <div className="about-logo"><IntellivexLogo size={120} /></div>
                  <h2 className="about-name">Intellivex AI</h2>
                  <h3 className="about-version">Kesari 1.2 · Build 2026.05</h3>
                  <div className="about-features">
                    {["Multi-turn memory", "Code execution sandbox", "Voice input", "File attachments", "PWA installable", "Export conversations", "6 AI models", "Rate limiting"].map(f => (
                      <span key={f} className="about-feat"><Check size={11} />{f}</span>
                    ))}
                  </div>
                  <p className="about-copy">Made with ♥ by Intellivex AI</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Rename input ───────────────────────────────────────────────────────────────
function RenameInput({ current, onSave, onCancel }: { current: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(current);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
      onBlur={() => onSave(val)} className="rename-input" title="Rename chat" placeholder="Enter new title..." />
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ chats, activeId, onSelect, onNew, onDelete, onRename, onSettings, open, onClose, loading, onToggleDesktop, onInstall, installable }: {
  chats: UIChat[]; activeId: string | null;
  onSelect: (id: string) => void; onNew: () => void;
  onDelete: (id: string) => void; onRename: (id: string, title: string) => void;
  onSettings: () => void; open: boolean; onClose: () => void; loading: boolean;
  onToggleDesktop?: () => void;
  onInstall?: () => void;
  installable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  let userName = "Account";
  let showClerkBtn = false;
  try {
    const { user } = useUser(); // eslint-disable-line react-hooks/rules-of-hooks
    if (user) { userName = user.firstName ?? user.emailAddresses?.[0]?.emailAddress ?? "Account"; showClerkBtn = true; }
  } catch { /* Clerk not configured */ }

  const filtered = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  // Group by Today / Yesterday / Older
  const now = Date.now();
  const DAY = 86_400_000;
  const groups: Record<string, UIChat[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  filtered.forEach(c => {
    const age = now - new Date(c.updated_at).getTime();
    if (age < DAY) groups.Today.push(c);
    else if (age < 2 * DAY) groups.Yesterday.push(c);
    else if (age < 7 * DAY) groups["Previous 7 days"].push(c);
    else groups.Older.push(c);
  });

  return (
    <>
      <AnimatePresence>
        {open && <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />}
      </AnimatePresence>
      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            <button className="brand-dropdown-btn" onClick={onSettings} title="Settings">
              <span className="sidebar-brand-name brand-shimmer">Intellivex AI</span>
              <ChevronDown size={14} className="brand-caret" />
            </button>
            <div className="tooltip-wrap">
              <button className="sidebar-toggle-btn" onClick={() => {
                if (window.innerWidth <= 768) onClose();
                else onToggleDesktop?.();
              }} title="Close sidebar">
                <PanelLeftClose size={18} />
              </button>
              <div className="tooltip">Close sidebar <span className="kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>S</kbd></span></div>
            </div>
          </div>

          <div className="sidebar-actions">
            <button className="sidebar-action-btn" onClick={() => { onNew(); onClose(); }} title="New chat">
              <Edit3 size={15} /> <span>New chat</span>
            </button>

            <div className="sidebar-search-action">
              <Search size={15} className="search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats" />
              {search && <button className="clear-search" onClick={() => setSearch("")} title="Clear search"><X size={12} /></button>}
            </div>

            <button className="sidebar-action-btn" onClick={onSettings} title="Settings">
              <MoreHorizontal size={15} /> <span>More</span>
            </button>
          </div>
        </div>
        <div className="chat-list">
          {loading && <div className="chat-loading"><Loader2 size={13} className="spin" /> Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div className="chat-empty">{search ? "No matching chats" : "No conversations yet"}</div>
          )}
          {Object.entries(groups).map(([label, items]) => items.length === 0 ? null : (
            <div key={label}>
              <p className="section-label">{label}</p>
              <AnimatePresence initial={false}>
                {items.map(chat => (
                  <motion.div key={chat.id}
                    className={`chat-item ${chat.id === activeId ? "active" : ""}`}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => { onSelect(chat.id); onClose(); }}
                  >
                    <span className="chat-accent-bar" />
                    <MessageSquare size={13} className="chat-icon" />
                    {editingId === chat.id ? (
                      <RenameInput current={chat.title}
                        onSave={v => { if (v.trim()) onRename(chat.id, v.trim()); setEditingId(null); }}
                        onCancel={() => setEditingId(null)} />
                    ) : (
                      <span className="chat-title">{chat.title}</span>
                    )}
                    <div className="chat-actions">
                      <button className="chat-action-btn" onClick={e => { e.stopPropagation(); setEditingId(chat.id); }} title="Rename"><Edit3 size={11} /></button>
                      <button className="chat-action-btn danger" onClick={e => { e.stopPropagation(); onDelete(chat.id); }} title="Delete"><Trash2 size={11} /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          {installable && (
            <button className="sidebar-footer-btn install-btn" onClick={() => onInstall?.()}>
              <Download size={14} /> Install App
            </button>
          )}
          <button className="sidebar-footer-btn" onClick={onSettings}><Settings size={14} /> Settings</button>
          {showClerkBtn ? (
            <div className="clerk-user-wrap"><ClerkUserButton afterSignOutUrl="/" /><span className="user-name">{userName}</span></div>
          ) : (
            <div className="sidebar-user"><div className="user-avatar">{userName[0]?.toUpperCase()}</div><span className="user-name">{userName}</span></div>
          )}
        </div>
      </div>
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    state, selectedModel, setSelectedModel,
    systemPrompt, setSystemPrompt,
    loadChats, selectChat, newChat, sendMessage, stopStreaming, regenerate,
    regenerateImage, branchChat,
    deleteChat, renameChat, reactToMessage
  } = useChatContext();

  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { open: workspaceOpen, openWorkspace, closeWorkspace } = useWorkspaceStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { chats, activeId, messages, loading, streaming, msgLoading, imageUsage } = state;

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to install prompt:', outcome);
    // Always clear state after a prompt attempt
    setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // Track whether user is at bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setAtBottom(scrollHeight - scrollTop - clientHeight < 80);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Lightweight scroll during streaming
  useEffect(() => {
    if (streaming) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages[messages.length - 1]?.content, streaming]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (window.innerWidth > 768) setDesktopSidebar(prev => !prev);
        else setMobileSidebar(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync theme-color meta tag with dark mode (dynamic creation to avoid HTML linting errors)
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', darkMode ? '#0a0a0c' : '#ffffff');
  }, [darkMode]);

  const handleNew = useCallback(() => newChat(), [newChat]);
  const handleSelect = useCallback((id: string) => { if (id !== activeId) selectChat(id); }, [activeId, selectChat]);
  const handleSend = useCallback((text: string, style?: string, attachments?: string[]) => sendMessage(text, style, attachments), [sendMessage]);
  const handleRegen = useCallback(() => regenerate(), [regenerate]);
  const handleRegenImage = useCallback(
    (prompt: string, style?: string, messageId?: string) => regenerateImage(prompt, style, messageId),
    [regenerateImage]
  );
  const handleDelete = useCallback((id: string) => deleteChat(id), [deleteChat]);
  const handleRename = useCallback((id: string, t: string) => renameChat(id, t), [renameChat]);
  const handleClear = useCallback(() => chats.forEach(c => deleteChat(c.id)), [chats, deleteChat]);

  const activeChat = chats.find(c => c.id === activeId);
  const chatTitle = activeChat?.title ?? "New conversation";

  return (
    <ErrorBoundary>
      <VisionProvider>
        <VoiceProvider>
          <ToastProvider>
            <ArtifactCtx.Provider value={() => { }}>
              {/* Vision drag-drop HUD (global) */}
              <VisionHUD />
              {/* Voice immersive orb (global) */}
              <VoiceOrb />
          <div className={`app ${darkMode ? '' : 'light'} ${desktopSidebar ? 'desktop-open' : 'desktop-closed'} ${workspaceOpen ? 'workspace-open' : ''}`}>
            <div className="global-orbs">
              <div className="global-orb global-orb-1" />
              <div className="global-orb global-orb-2" />
              <div className="global-orb global-orb-3" />
            </div>
            <Sidebar
              chats={chats} activeId={activeId}
              onSelect={handleSelect} onNew={handleNew}
              onDelete={handleDelete} onRename={handleRename}
              onSettings={() => setSettingsOpen(true)}
              open={mobileSidebar} onClose={() => setMobileSidebar(false)}
              loading={loading}
              onToggleDesktop={() => setDesktopSidebar(!desktopSidebar)}
              onInstall={handleInstall}
              installable={isInstallable}
            />
            <div className="main">
              {/* Header */}
              <div className="header">
                <div className="header-left">
                  <button className="mobile-menu-btn" onClick={() => setMobileSidebar(true)} title="Open menu"><Menu size={18} /></button>
                  {!desktopSidebar && (
                    <div className="tooltip-wrap">
                      <button className="desktop-menu-btn" onClick={() => setDesktopSidebar(true)} title="Open sidebar"><PanelLeft size={18} /></button>
                      <div className="tooltip tooltip-right">Open sidebar <span className="kbd"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>S</kbd></span></div>
                    </div>
                  )}
                  <div className="kesari-indicator">
                    <motion.div className="kesari-pulse" animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    <span className="kesari-label">Kesari 1.2</span>
                  </div>
                  {activeId && (
                    <motion.span className="header-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={chatTitle}>
                      {chatTitle}
                    </motion.span>
                  )}
                </div>
                <div className="header-right">
                  {messages.length > 0 && (
                    <div className="export-wrap">
                      <button className="icon-btn" onClick={() => setExportOpen(!exportOpen)} title="Export alternatives">
                        <Download size={16} />
                      </button>
                      <AnimatePresence>
                        {exportOpen && (
                          <motion.div className="export-menu" initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.12 }}>
                            <button onClick={() => { exportChat(messages, chatTitle, "md"); setExportOpen(false); }}>📝 Markdown (.md)</button>
                            <button onClick={() => { exportChat(messages, chatTitle, "txt"); setExportOpen(false); }}>📄 Plain text (.txt)</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {/* Immersive Voice Mode button */}
                  <ImmersiveVoiceBtn />
                  <button
                    className={`icon-btn ${workspaceOpen ? 'active' : ''}`}
                    onClick={() => workspaceOpen ? closeWorkspace() : openWorkspace()}
                    title="Toggle Workspace"
                  >
                    <LayoutPanelLeft size={15} />
                  </button>
                  <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
                    <Settings size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages" ref={messagesRef}>
                <div className="messages-inner">
                  {msgLoading ? (
                    <div className="msgs-loading"><Loader2 size={20} className="spin" /><span>Loading conversation…</span></div>
                  ) : !activeId && messages.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      <AnimatePresence initial={false} mode="popLayout">
                        {messages.map((msg, i) => (
                          <MessageRow
                            key={msg.id}
                            msg={msg}
                            isLast={i === messages.length - 1}
                            streaming={streaming}
                            onRegenerate={i === messages.length - 1 ? handleRegen : undefined}
                            onRegenerateImage={handleRegenImage}
                            onReact={(r) => reactToMessage(msg.id, r)}
                            onBranchChat={branchChat}
                          />
                        ))}
                      </AnimatePresence>
                      <div ref={bottomRef} className="chat-bottom-spacer" />
                    </>
                  )}
                </div>
                {/* Scroll-to-bottom button */}
                <AnimatePresence>
                  {!atBottom && messages.length > 0 && (
                    <motion.button
                      className="scroll-to-bottom"
                      onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ duration: 0.18 }}
                      title="Scroll to bottom"
                    >
                      <ArrowDown size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <InputArea onSend={handleSend} disabled={streaming} onStop={stopStreaming} imageUsage={imageUsage} />

              {/* Workspace Panel */}
              <WorkspacePanel />

            </div>

            <SettingsModal
              open={settingsOpen} onClose={() => setSettingsOpen(false)}
              darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}
              onClearChats={handleClear}
              selectedModel={selectedModel} onModelChange={setSelectedModel}
              systemPrompt={systemPrompt} onSystemPromptChange={setSystemPrompt}
            />
          </div>
            </ArtifactCtx.Provider>
          </ToastProvider>
        </VoiceProvider>
      </VisionProvider>
      <Analytics />
    </ErrorBoundary>
  );
}

// ── Immersive Voice Button (needs VoiceContext) ───────────────────────────────
function ImmersiveVoiceBtn() {
  let voice: ReturnType<typeof useVoice> | null = null;
  try { voice = useVoice(); } catch { return null; }
  const { immersiveMode, toggleImmersive, speaking, listening } = voice;
  const isActive = immersiveMode || speaking || listening;
  return (
    <motion.button
      className={`icon-btn voice-immersive-btn ${isActive ? 'active' : ''}`}
      onClick={toggleImmersive}
      title={immersiveMode ? 'Exit voice mode' : 'Immersive voice mode'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      {speaking ? (
        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <VolumeX size={15} />
        </motion.span>
      ) : (
        <Radio size={15} />
      )}
    </motion.button>
  );
}
