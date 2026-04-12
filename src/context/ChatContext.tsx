import { createContext, useContext, useReducer, useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchChats,
  createChat,
  deleteChat as apiDeleteChat,
  renameChat as apiRenameChat,
  fetchMessages,
  postMessage,
  streamChat,
} from '../lib/api'

// ── UI-layer types ────────────────────────────────────────────────────────────
export interface UIMessage {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  streaming?: boolean
  error?: boolean
  reaction?: 'up' | 'down' | null
}

export interface UIChat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// ── State ─────────────────────────────────────────────────────────────────────
interface State {
  chats: UIChat[]
  activeId: string | null
  messages: UIMessage[]
  loading: boolean
  msgLoading: boolean
  streaming: boolean
}

const initialState: State = {
  chats: [],
  activeId: null,
  messages: [],
  loading: false,
  msgLoading: false,
  streaming: false,
}

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MSG_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_CHATS'; payload: UIChat[] }
  | { type: 'ADD_CHAT'; payload: UIChat }
  | { type: 'REMOVE_CHAT'; payload: string }
  | { type: 'UPDATE_CHAT_TITLE'; payload: { id: string; title: string } }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: UIMessage[] }
  | { type: 'ADD_MESSAGE'; payload: UIMessage }
  | { type: 'UPDATE_MSG_CONTENT'; payload: { id: string; content: string; streaming: boolean } }
  | { type: 'FINALIZE_MSG'; payload: { id: string; content: string } }
  | { type: 'ERROR_MSG'; payload: string }
  | { type: 'REACT_MSG'; payload: { id: string; reaction: 'up' | 'down' | null } }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_MSG_LOADING': return { ...state, msgLoading: action.payload }
    case 'SET_STREAMING': return { ...state, streaming: action.payload }
    case 'SET_CHATS': return { ...state, chats: action.payload }
    case 'ADD_CHAT': return { ...state, chats: [action.payload, ...state.chats] }
    case 'REMOVE_CHAT': {
      const chats = state.chats.filter(c => c.id !== action.payload)
      const activeId = state.activeId === action.payload ? null : state.activeId
      const messages = activeId === null ? [] : state.messages
      return { ...state, chats, activeId, messages }
    }
    case 'UPDATE_CHAT_TITLE':
      return { ...state, chats: state.chats.map(c => c.id === action.payload.id ? { ...c, title: action.payload.title } : c) }
    case 'SET_ACTIVE': return { ...state, activeId: action.payload, messages: [] }
    case 'SET_MESSAGES': return { ...state, messages: action.payload }
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] }
    case 'UPDATE_MSG_CONTENT':
      return { ...state, messages: state.messages.map(m => m.id === action.payload.id ? { ...m, content: action.payload.content, streaming: action.payload.streaming } : m) }
    case 'FINALIZE_MSG':
      return { ...state, messages: state.messages.map(m => m.id === action.payload.id ? { ...m, content: action.payload.content, streaming: false, error: false } : m) }
    case 'ERROR_MSG':
      return { ...state, messages: state.messages.map(m => m.id === action.payload ? { ...m, streaming: false, error: true } : m) }
    case 'REACT_MSG':
      return { ...state, messages: state.messages.map(m => m.id === action.payload.id ? { ...m, reaction: action.payload.reaction } : m) }
    default: return state
  }
}

// ── Available models ──────────────────────────────────────────────────────────
export const AVAILABLE_MODELS = [
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Kesari 1.1', provider: 'INTELLIVEX AI' },
]
const DEFAULT_MODEL = AVAILABLE_MODELS[0].id

// ── Context ───────────────────────────────────────────────────────────────────
interface ChatContextValue {
  state: State
  selectedModel: string
  setSelectedModel: (m: string) => void
  systemPrompt: string
  setSystemPrompt: (p: string) => void
  loadChats: () => Promise<void>
  selectChat: (id: string) => Promise<void>
  newChat: () => void
  sendMessage: (text: string) => Promise<void>
  stopStreaming: () => void
  regenerate: () => Promise<void>
  deleteChat: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<void>
  reactToMessage: (id: string, reaction: 'up' | 'down' | null) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Abort controller for stop-generation
  const abortRef = useRef<AbortController | null>(null)

  // Model selection (persisted to localStorage)
  const [selectedModel, setSelectedModelState] = useState<string>(
    () => localStorage.getItem('kesari-model') ?? DEFAULT_MODEL
  )
  const setSelectedModel = useCallback((m: string) => {
    localStorage.setItem('kesari-model', m)
    setSelectedModelState(m)
  }, [])

  // System prompt (persisted)
  const [systemPrompt, setSystemPromptState] = useState<string>(
    () => localStorage.getItem('kesari-system-prompt') ?? ''
  )
  const setSystemPrompt = useCallback((p: string) => {
    localStorage.setItem('kesari-system-prompt', p)
    setSystemPromptState(p)
  }, [])

  const loadChats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const chats = await fetchChats()
      dispatch({ type: 'SET_CHATS', payload: chats as UIChat[] })
    } catch (err) {
      console.error('loadChats error', err)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const selectChat = useCallback(async (id: string) => {
    dispatch({ type: 'SET_ACTIVE', payload: id })
    dispatch({ type: 'SET_MSG_LOADING', payload: true })
    try {
      const msgs = await fetchMessages(id)
      dispatch({ type: 'SET_MESSAGES', payload: msgs as UIMessage[] })
    } catch (err) {
      console.error('selectChat error', err)
    } finally {
      dispatch({ type: 'SET_MSG_LOADING', payload: false })
    }
  }, [])

  const newChat = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE', payload: null })
    dispatch({ type: 'SET_MESSAGES', payload: [] })
  }, [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    dispatch({ type: 'SET_STREAMING', payload: false })
    const msgs = stateRef.current.messages
    const streamingMsg = msgs.find(m => m.streaming)
    if (streamingMsg) {
      dispatch({ type: 'FINALIZE_MSG', payload: { id: streamingMsg.id, content: streamingMsg.content || '*(stopped)*' } })
    }
  }, [])

  const reactToMessage = useCallback((id: string, reaction: 'up' | 'down' | null) => {
    dispatch({ type: 'REACT_MSG', payload: { id, reaction } })
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    let chatId = stateRef.current.activeId

    if (!chatId) {
      const title = text.length > 60 ? text.slice(0, 60) + '…' : text
      try {
        const chat = await createChat(title)
        chatId = chat.id
        dispatch({ type: 'ADD_CHAT', payload: chat as UIChat })
        dispatch({ type: 'SET_ACTIVE', payload: chatId })
      } catch (err) {
        console.error('createChat error', err)
        return
      }
    } else {
      const activeChat = stateRef.current.chats.find(c => c.id === chatId)
      if (activeChat?.title === 'New chat' || stateRef.current.messages.length === 0) {
        const title = text.length > 60 ? text.slice(0, 60) + '…' : text
        try {
          await apiRenameChat(chatId, title)
          dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { id: chatId, title } })
        } catch { /* non-critical */ }
      }
    }

    const tempUserId = `temp-user-${Date.now()}`
    dispatch({ type: 'ADD_MESSAGE', payload: { id: tempUserId, chat_id: chatId, role: 'user', content: text, created_at: new Date().toISOString() } })

    const tempAiId = `temp-ai-${Date.now()}`
    dispatch({ type: 'ADD_MESSAGE', payload: { id: tempAiId, chat_id: chatId, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true } })
    dispatch({ type: 'SET_STREAMING', payload: true })

    // Build context: all non-streaming messages + new user message
    const contextMessages = stateRef.current.messages
      .filter(m => !m.streaming && !m.error)
      .map(m => ({ role: m.role, content: m.content }))
    contextMessages.push({ role: 'user', content: text })

    const currentChatId = chatId

    postMessage(currentChatId, 'user', text).catch(err => console.error('postMessage(user) error', err))

    const controller = new AbortController()
    abortRef.current = controller

    // ── Word-by-word smooth streaming (throttled at ~60fps) ──────────────────
    let accumulated = ''         // running total for this generation
    let pendingFlush: ReturnType<typeof setTimeout> | null = null

    const flushToUI = () => {
      pendingFlush = null
      dispatch({ type: 'UPDATE_MSG_CONTENT', payload: { id: tempAiId, content: accumulated, streaming: true } })
    }

    await streamChat({
      chatId: currentChatId,
      messages: contextMessages,
      model: localStorage.getItem('kesari-model') ?? DEFAULT_MODEL,
      systemPrompt: stateRef.current.streaming ? undefined : (localStorage.getItem('kesari-system-prompt') ?? undefined),
      signal: controller.signal,

      onToken: (token) => {
        accumulated += token
        if (!pendingFlush) {
          // Batch token updates to ~60fps for smooth word-by-word effect
          pendingFlush = setTimeout(flushToUI, 16)
        }
      },

      onDone: async (fullContent) => {
        // Flush any remaining buffered tokens
        if (pendingFlush) { clearTimeout(pendingFlush); pendingFlush = null }
        abortRef.current = null
        dispatch({ type: 'FINALIZE_MSG', payload: { id: tempAiId, content: fullContent || accumulated } })
        dispatch({ type: 'SET_STREAMING', payload: false })
        // Guard-gated DB reload: don't overwrite if user started a new message
        setTimeout(async () => {
          if (stateRef.current.streaming) return
          try {
            const msgs = await fetchMessages(currentChatId)
            if (!stateRef.current.streaming && msgs.length > 0) {
              dispatch({ type: 'SET_MESSAGES', payload: msgs as UIMessage[] })
            }
          } catch { /* silent */ }
        }, 400)
      },

      onError: (err) => {
        if (pendingFlush) { clearTimeout(pendingFlush); pendingFlush = null }
        abortRef.current = null
        if (err.name === 'AbortError') return
        console.error('streamChat error', err)
        dispatch({ type: 'ERROR_MSG', payload: tempAiId })
        dispatch({ type: 'SET_STREAMING', payload: false })
      },
    })
  }, [])

  const regenerate = useCallback(async () => {
    const { messages, activeId } = stateRef.current
    if (!activeId || messages.length === 0) return
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    const withoutLastAi = messages.filter((m, i) => !(i === messages.length - 1 && m.role === 'assistant'))
    dispatch({ type: 'SET_MESSAGES', payload: withoutLastAi })
    await sendMessage(lastUserMsg.content)
  }, [sendMessage])

  const deleteChat = useCallback(async (id: string) => {
    try {
      await apiDeleteChat(id)
      dispatch({ type: 'REMOVE_CHAT', payload: id })
    } catch (err) {
      console.error('deleteChat error', err)
    }
  }, [])

  const renameChat = useCallback(async (id: string, title: string) => {
    try {
      await apiRenameChat(id, title)
      dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { id, title } })
    } catch (err) {
      console.error('renameChat error', err)
    }
  }, [])

  return (
    <ChatContext.Provider value={{
      state, selectedModel, setSelectedModel,
      systemPrompt, setSystemPrompt,
      loadChats, selectChat, newChat,
      sendMessage, stopStreaming, regenerate,
      deleteChat, renameChat, reactToMessage,
    }}>
      {children}
    </ChatContext.Provider>
  )
}
