import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser, UserButton as ClerkUserButton } from "@clerk/clerk-react";
import {
  Search, Trash2, Edit3, Settings, Send, Copy, Check,
  MessageSquare, X, Menu, Sun, Moon, RotateCcw, Loader2,
  Square, Download, Mic, MicOff, Paperclip, ChevronDown, Play,
  ThumbsUp, ThumbsDown, Terminal, Zap, Brain, Code2,
  MoreHorizontal, PanelLeftClose, PanelLeft
} from "lucide-react";
import { useChatContext, AVAILABLE_MODELS } from "./context/ChatContext";
import type { UIMessage, UIChat } from "./context/ChatContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { IntellivexLogo } from "./components/Logo";

// ── Suggestions ───────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { heading: "Write & debug code", sub: "Build a React hook that debounces API calls", icon: <Code2 size={15} /> },
  { heading: "Explain a concept", sub: "How does RAG work in modern AI systems?", icon: <Brain size={15} /> },
  { heading: "Plan a project", sub: "A 4-week launch roadmap for a SaaS startup", icon: <Zap size={15} /> },
  { heading: "Draft content", sub: "Write a cold email to a venture capitalist", icon: <IntellivexLogo size={15} /> },
  { heading: "Analyze data", sub: "Write SQL to find the top 10 users by activity", icon: <Terminal size={15} /> },
  { heading: "Strategy", sub: "How should a startup price its API product?", icon: <Zap size={15} /> },
];

// ── Code sandbox ───────────────────────────────────────────────────────────────
function CodeSandbox({ code }: { code: string }) {
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setOutput(null);
    const logs: string[] = [];
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox.add("allow-scripts");
    document.body.appendChild(iframe);
    try {
      const win = iframe.contentWindow as any;
      win.console = {
        log: (...a: any[]) => logs.push(a.map(String).join(" ")),
        error: (...a: any[]) => logs.push("Error: " + a.map(String).join(" ")),
        warn: (...a: any[]) => logs.push("Warn: " + a.map(String).join(" ")),
      };
      win.eval(code);
      setOutput(logs.length > 0 ? logs.join("\n") : "(no output)");
    } catch (e: any) {
      setOutput("RuntimeError: " + e.message);
    } finally {
      document.body.removeChild(iframe);
      setRunning(false);
    }
  };

  return (
    <div className="code-sandbox">
      <button onClick={run} disabled={running} className="run-btn">
        {running ? <Loader2 size={11} className="spin" /> : <Play size={11} />}
        {running ? "Running…" : "Run"}
      </button>
      <AnimatePresence>
        {output !== null && (
          <motion.div
            className="sandbox-output"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="sandbox-label">Output</div>
            <pre className="sandbox-pre">{output}</pre>
            <button className="sandbox-close" onClick={() => setOutput(null)} title="Close output"><X size={10} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Code Block ─────────────────────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const isJS = ["js", "javascript", "ts", "typescript"].includes(lang.toLowerCase());
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{lang || "code"}</span>
        <div className="code-header-actions">
          {isJS && <CodeSandbox code={code} />}
          <button onClick={copy} className={`code-copy ${copied ? "copied" : ""}`}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="code-pre"><code>{code}</code></div>
    </div>
  );
}

// ── Inline markdown ────────────────────────────────────────────────────────────
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
function TextBlock({ text }: { text: string }) {
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
    else if (line.startsWith("# "))  { flushList(); out.push(<h1 key={i}>{renderInline(line.slice(2))}</h1>); }
    else if (/^\d+\.\s/.test(line))  { numItems.push(<li key={i}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>); }
    else if (line.startsWith("- ") || line.startsWith("* ")) { listItems.push(<li key={i}>{renderInline(line.slice(2))}</li>); }
    else if (line.trim() === "---")  { flushList(); out.push(<hr key={i} className="md-hr" />); }
    else if (line.startsWith("> "))  { flushList(); out.push(<blockquote key={i}>{renderInline(line.slice(2))}</blockquote>); }
    else if (line.trim() === "") { flushList(); out.push(<div key={i} className="md-spacer" />); }
    else { flushList(); out.push(<p key={i}>{renderInline(line)}</p>); }
  });
  flushList();
  flushTable();
  return <>{out}</>;
}

function MarkdownBody({ content }: { content: string }) {
  const nodes: React.ReactNode[] = [];
  const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = codeRe.exec(content)) !== null) {
    const before = content.slice(last, m.index);
    if (before.trim()) nodes.push(<TextBlock key={key++} text={before} />);
    nodes.push(<CodeBlock key={key++} lang={m[1]} code={m[2].trim()} />);
    last = m.index + m[0].length;
  }
  const after = content.slice(last);
  if (after.trim()) nodes.push(<TextBlock key={key++} text={after} />);
  return <div className="md-content">{nodes}</div>;
}

// ── ChatGPT-style typing indicator ────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span className="dot" /><span className="dot" /><span className="dot" />
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
function MessageRow({ msg, onRegenerate, isLast, streaming, onReact }: {
  msg: UIMessage; onRegenerate?: () => void; isLast?: boolean; streaming?: boolean;
  onReact: (r: "up" | "down" | null) => void;
}) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div
      className={`message-row ${isUser ? "user-row" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className="message-inner">
        <div className={`msg-avatar ${isUser ? "user" : "ai"}`}>
          {isUser ? "Y" : <IntellivexLogo size={64} />}
        </div>
        <div className="msg-body">
          <div className="msg-author">
            {isUser ? "You" : (
              <><span>Kesari</span><span className="badge">1.1</span></>
            )}
          </div>
          {msg.streaming && msg.content === "" ? (
            <TypingIndicator />
          ) : msg.error ? (
            <div className="msg-error">
              <span>⚠ Something went wrong. Please try again.</span>
              {onRegenerate && (
                <button className="msg-action" onClick={onRegenerate}><RotateCcw size={11} /> Retry</button>
              )}
            </div>
          ) : isUser ? (
            <div className="user-bubble">{msg.content}</div>
          ) : (
            <div className={msg.streaming ? "stream-active" : ""}>
              <MarkdownBody content={msg.content} />
              {msg.streaming && msg.content && (
                <span className="stream-cursor" aria-hidden />
              )}
            </div>
          )}
          {!msg.streaming && !msg.error && (
            <div className="msg-footer">
              <button onClick={copy} className={`msg-action ${copied ? "green" : ""}`}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              {!isUser && isLast && !streaming && onRegenerate && (
                <button onClick={onRegenerate} className="msg-action">
                  <RotateCcw size={11} /> Regenerate
                </button>
              )}
              {!isUser && (
                <Reactions reaction={msg.reaction} onReact={onReact} />
              )}
              <span className="msg-timestamp">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="empty-state">
      <motion.div
        className="empty-logo"
        animate={{ y: [0, -6, 0], boxShadow: ["0 0 0 0 rgba(16,185,129,0.3)", "0 0 0 12px rgba(16,185,129,0)", "0 0 0 0 rgba(16,185,129,0)"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <IntellivexLogo size={100} />
      </motion.div>
      <motion.h1
        className="empty-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        How can I help you today?
      </motion.h1>
      <motion.p
        className="empty-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Kesari 1.1 · Powered by Intellivex AI
      </motion.p>
      <motion.div
        className="suggestions"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, staggerChildren: 0.05 }}
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            className="suggestion-card"
            onClick={() => onPick(s.sub)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <div className="suggestion-icon">{s.icon}</div>
            <p className="suggestion-heading">{s.heading}</p>
            <p className="suggestion-sub">{s.sub}</p>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Voice input hook ──────────────────────────────────────────────────────────
function useVoiceInput(onResult: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const toggle = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start(); recognitionRef.current = rec; setListening(true);
  }, [listening, onResult]);
  return { listening, toggle };
}

// ── Input Area ────────────────────────────────────────────────────────────────
function InputArea({ onSend, disabled, onStop }: {
  onSend: (t: string) => void; disabled: boolean; onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const header = `**[File: ${file.name}]**\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\`\n\n`;
      setValue(prev => header + (prev || ""));
      ref.current?.focus();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const charCount = value.length;
  const nearLimit = charCount > 3500;

  return (
    <div className="input-area">
      <div className="input-wrap">
        <div className={`input-box ${listening ? "listening" : ""} ${disabled ? "streaming-active" : ""}`}>
          <button type="button" className="input-icon-btn" title="Attach file" onClick={() => fileRef.current?.click()}>
            <Paperclip size={15} />
          </button>
          <input ref={fileRef} type="file" className="file-input-hidden" title="Attach file"
            accept=".txt,.md,.py,.js,.ts,.tsx,.jsx,.json,.csv,.html,.css,.yaml,.yml,.sh,.sql"
            onChange={handleFileChange}
          />
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => { setValue(e.target.value); resize(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? "🎤 Listening…" : "Message Kesari 1.1…"}
            rows={1}
          />
          {nearLimit && <span className="char-count">{charCount}</span>}
          <button type="button" className={`input-icon-btn ${listening ? "active-mic" : ""}`}
            title="Voice input" onClick={toggleVoice}>
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          {disabled ? (
            <motion.button onClick={onStop} className="send-btn stop-btn" title="Stop"
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <Square size={13} />
            </motion.button>
          ) : (
            <motion.button onClick={send} disabled={!value.trim()} className="send-btn" title="Send message"
              whileHover={value.trim() ? { scale: 1.08 } : {}} whileTap={value.trim() ? { scale: 0.92 } : {}}>
              <Send size={13} />
            </motion.button>
          )}
        </div>
        <p className="input-hint">
          <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
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
    const author = m.role === "user" ? "**You**" : "**Kesari 1.1**";
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
  const DEFAULT_PROMPT = `You are Kesari 1.1, an AI assistant made by Intellivex AI.\n\nKeep responses short and conversational unless the user asks for something detailed.\nDo NOT use headers or excessive bullet points for simple questions — just answer naturally.\nOnly use markdown formatting (code blocks, lists) when it genuinely helps.\nBe direct, friendly, and clear.`;

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
                  <h3 className="about-version">Kesari 1.1 · Build 2026.04</h3>
                  <div className="about-features">
                    {["Multi-turn memory", "Code execution sandbox", "Voice input", "File attachments", "PWA installable", "Export conversations", "6 AI models", "Rate limiting"].map(f => (
                      <span key={f} className="about-feat"><Check size={11} />{f}</span>
                    ))}
                  </div>
                  <p className="about-copy">Made with ♥ by Intellivex · Powered by OpenRouter</p>
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
function Sidebar({ chats, activeId, onSelect, onNew, onDelete, onRename, onSettings, open, onClose, loading, onToggleDesktop }: {
  chats: UIChat[]; activeId: string | null;
  onSelect: (id: string) => void; onNew: () => void;
  onDelete: (id: string) => void; onRename: (id: string, title: string) => void;
  onSettings: () => void; open: boolean; onClose: () => void; loading: boolean;
  onToggleDesktop?: () => void;
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
              <span className="sidebar-brand-name">Intellivex AI</span>
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
    deleteChat, renameChat, reactToMessage,
  } = useChatContext();

  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { chats, activeId, messages, loading, streaming, msgLoading } = state;

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

  const handleNew    = useCallback(() => newChat(), [newChat]);
  const handleSelect = useCallback((id: string) => { if (id !== activeId) selectChat(id); }, [activeId, selectChat]);
  const handleSend   = useCallback((text: string) => sendMessage(text), [sendMessage]);
  const handleRegen  = useCallback(() => regenerate(), [regenerate]);
  const handleDelete = useCallback((id: string) => deleteChat(id), [deleteChat]);
  const handleRename = useCallback((id: string, t: string) => renameChat(id, t), [renameChat]);
  const handleClear  = useCallback(() => chats.forEach(c => deleteChat(c.id)), [chats, deleteChat]);

  const activeChat = chats.find(c => c.id === activeId);
  const chatTitle = activeChat?.title ?? "New conversation";

  return (
    <ErrorBoundary>
      <div className={`app ${darkMode ? "" : "light"} ${desktopSidebar ? "desktop-open" : "desktop-closed"}`}>
        <Sidebar
          chats={chats} activeId={activeId}
          onSelect={handleSelect} onNew={handleNew}
          onDelete={handleDelete} onRename={handleRename}
          onSettings={() => setSettingsOpen(true)}
          open={mobileSidebar} onClose={() => setMobileSidebar(false)}
          loading={loading}
          onToggleDesktop={() => setDesktopSidebar(!desktopSidebar)}
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
                <span className="kesari-label">Kesari 1.1</span>
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
              <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
                <Settings size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages">
            <div className="messages-inner">
              {msgLoading ? (
                <div className="msgs-loading"><Loader2 size={20} className="spin" /><span>Loading conversation…</span></div>
              ) : !activeId && messages.length === 0 ? (
                <EmptyState onPick={handleSend} />
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <MessageRow
                        key={msg.id}
                        msg={msg}
                        isLast={i === messages.length - 1}
                        streaming={streaming}
                        onRegenerate={i === messages.length - 1 ? handleRegen : undefined}
                        onReact={(r) => reactToMessage(msg.id, r)}
                      />
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} className="chat-bottom-spacer" />
                </>
              )}
            </div>
          </div>

          {/* Input */}
          <InputArea onSend={handleSend} disabled={streaming} onStop={stopStreaming} />
        </div>

        <SettingsModal
          open={settingsOpen} onClose={() => setSettingsOpen(false)}
          darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}
          onClearChats={handleClear}
          selectedModel={selectedModel} onModelChange={setSelectedModel}
          systemPrompt={systemPrompt} onSystemPromptChange={setSystemPrompt}
        />
      </div>
    </ErrorBoundary>
  );
}
