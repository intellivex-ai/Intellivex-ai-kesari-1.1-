import { create } from 'zustand'

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkspaceTab = 'preview' | 'terminal' | 'files'

export interface SandboxOutput {
  type: 'log' | 'error' | 'result'
  text: string
  timestamp: number
}

export interface WorkspaceFile {
  name: string
  content: string
  language: string
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface WorkspaceState {
  open: boolean
  activeTab: WorkspaceTab
  files: WorkspaceFile[]
  activeFile: string | null
  sandboxOutputs: SandboxOutput[]
  previewCode: string
  previewLang: string
  isRunning: boolean

  // Actions
  openWorkspace: (code?: string, lang?: string) => void
  closeWorkspace: () => void
  setTab: (tab: WorkspaceTab) => void
  runCode: (code: string, lang: string) => void
  clearOutputs: () => void
  addFile: (file: WorkspaceFile) => void
  setActiveFile: (name: string) => void
  updateFileContent: (name: string, content: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  open: false,
  activeTab: 'preview',
  files: [],
  activeFile: null,
  sandboxOutputs: [],
  previewCode: '',
  previewLang: '',
  isRunning: false,

  openWorkspace: (code = '', lang = 'html') => {
    set({ open: true, previewCode: code, previewLang: lang, activeTab: 'preview' })
  },

  closeWorkspace: () => set({ open: false }),

  setTab: (tab) => set({ activeTab: tab }),

  runCode: async (code, lang) => {
    const { sandboxOutputs } = get()
    set({ isRunning: true, activeTab: 'terminal' })

    const ts = Date.now()

    if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
      // Execute JS in an isolated worker-like iframe
      const outputs: SandboxOutput[] = []
      try {
        const sandboxFrame = document.createElement('iframe')
        sandboxFrame.style.display = 'none'
        sandboxFrame.sandbox.add('allow-scripts')
        document.body.appendChild(sandboxFrame)

        const script = `
          const logs = [];
          const origLog = console.log;
          const origErr = console.error;
          console.log = (...args) => { logs.push({ type: 'log', text: args.join(' ') }); origLog(...args); };
          console.error = (...args) => { logs.push({ type: 'error', text: args.join(' ') }); origErr(...args); };
          try {
            ${code}
            window.parent.postMessage({ type: 'done', logs }, '*');
          } catch(e) {
            window.parent.postMessage({ type: 'error', error: e.message, logs }, '*');
          }
        `

        const result = await new Promise<{ logs: Array<{ type: string; text: string }>; error?: string }>((resolve) => {
          const handler = (e: MessageEvent) => {
            if (e.source === sandboxFrame.contentWindow) {
              window.removeEventListener('message', handler)
              document.body.removeChild(sandboxFrame)
              resolve(e.data)
            }
          }
          window.addEventListener('message', handler)
          sandboxFrame.srcdoc = `<script>${script}<\/script>`
        })

        result.logs.forEach((l) => {
          outputs.push({ type: l.type as 'log' | 'error', text: l.text, timestamp: ts })
        })
        if (result.error) {
          outputs.push({ type: 'error', text: `Runtime Error: ${result.error}`, timestamp: ts })
        } else if (outputs.length === 0) {
          outputs.push({ type: 'result', text: '✓ Executed successfully (no output)', timestamp: ts })
        }
      } catch (err) {
        outputs.push({ type: 'error', text: String(err), timestamp: ts })
      }

      set({ sandboxOutputs: [...sandboxOutputs, ...outputs], isRunning: false })
    } else if (lang === 'python' || lang === 'py') {
      const outputs: SandboxOutput[] = []
      try {
        // Run Python using a Web Worker to keep the UI thread responsive
        const workerCode = `
          importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
          
          async function main() {
            try {
              let pyodide = await loadPyodide({
                stdout: (text) => postMessage({ type: 'log', text }),
                stderr: (text) => postMessage({ type: 'error', text })
              });
              
              onmessage = async (e) => {
                try {
                  await pyodide.runPythonAsync(e.data.code);
                  postMessage({ type: 'done' });
                } catch (err) {
                  postMessage({ type: 'runtime-error', text: err.toString() });
                }
              };
              postMessage({ type: 'ready' });
            } catch (initErr) {
              postMessage({ type: 'init-error', text: initErr.toString() });
            }
          }
          main();
        `
        const blob = new Blob([workerCode], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(blob)
        const worker = new Worker(workerUrl)

        set({ sandboxOutputs: [...sandboxOutputs, { type: 'log', text: 'Loading Python runtime (Pyodide)...', timestamp: ts }] })

        const result = await new Promise<{ type: string; text?: string }>((resolve) => {
          let hasRun = false;
          worker.onmessage = (e) => {
            if (e.data.type === 'ready') {
              hasRun = true;
              set((s) => ({ sandboxOutputs: [...s.sandboxOutputs, { type: 'log', text: 'Executing...', timestamp: Date.now() }] }))
              worker.postMessage({ code })
            } else if (e.data.type === 'log' || e.data.type === 'error') {
              outputs.push({ type: e.data.type, text: e.data.text, timestamp: Date.now() })
            } else if (e.data.type === 'done') {
              resolve({ type: 'done' })
            } else if (e.data.type === 'runtime-error' || e.data.type === 'init-error') {
              resolve({ type: 'error', text: e.data.text })
            }
          }
          worker.onerror = (e) => resolve({ type: 'error', text: e.message })
          
          // Fallback timeout for initialization
          setTimeout(() => {
            if (!hasRun) resolve({ type: 'error', text: 'Timeout loading Python runtime' })
          }, 15000)
        })

        worker.terminate()
        URL.revokeObjectURL(workerUrl)

        if (result.type === 'error') {
          outputs.push({ type: 'error', text: result.text || 'Unknown Error', timestamp: Date.now() })
        } else if (outputs.length === 0) {
          outputs.push({ type: 'result', text: '✓ Python executed successfully (no output)', timestamp: Date.now() })
        }
      } catch (err) {
        outputs.push({ type: 'error', text: String(err), timestamp: Date.now() })
      }
      set((s) => ({ sandboxOutputs: [...s.sandboxOutputs, ...outputs], isRunning: false }))
    } else {
      // Non-JS/Python languages: show a stub message
      set({
        sandboxOutputs: [
          ...sandboxOutputs,
          { type: 'log', text: `▶ Running ${lang}...`, timestamp: ts },
          { type: 'result', text: `⚠ Browser sandbox currently supports JavaScript and Python only.`, timestamp: ts + 1 },
        ],
        isRunning: false,
      })
    }
  },

  clearOutputs: () => set({ sandboxOutputs: [] }),

  addFile: (file) => set((s) => ({ files: [...s.files.filter(f => f.name !== file.name), file] })),

  setActiveFile: (name) => set({ activeFile: name }),

  updateFileContent: (name, content) =>
    set((s) => ({
      files: s.files.map(f => f.name === name ? { ...f, content } : f),
    })),
}))
