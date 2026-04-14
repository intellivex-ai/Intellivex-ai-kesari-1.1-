import { useState } from "react";
import { Check, Copy, LayoutPanelLeft, Terminal } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useWorkspaceStore } from "../stores/workspaceStore";

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const { openWorkspace, runCode } = useWorkspaceStore();
  const isWeb = ["js", "javascript", "ts", "typescript", "html", "css", "jsx", "tsx"].includes(lang.toLowerCase());
  const isRunnable = ["js", "javascript", "ts", "typescript", "html"].includes(lang.toLowerCase());

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-lang-badge">
          <span className={`code-lang-dot lang-dot-${lang.toLowerCase()}`} />
          <span className="code-lang">{lang || 'code'}</span>
        </div>
        <div className="code-header-actions">
          {isWeb && (
            <button onClick={() => openWorkspace(code, lang)} className="code-copy code-preview-btn">
              <LayoutPanelLeft size={11} /> Preview
            </button>
          )}
          {isRunnable && (
            <button onClick={() => { openWorkspace(code, lang); runCode(code, lang); }} className="code-copy code-run-btn">
              <Terminal size={11} /> Run
            </button>
          )}
          <button onClick={copy} className={`code-copy ${copied ? 'copied' : ''}`}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="code-pre"><code>{code}</code></div>
    </div>
  );
}
