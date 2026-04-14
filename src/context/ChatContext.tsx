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
  generateImage as apiGenerateImage,
} from '../lib/api'
import skillsPrompt from '../../skills.md?raw'
import { AGENTS, parseAgentMention } from '../lib/agents'
import type { AgentId } from '../lib/agents'

// ── Image intent detection ────────────────────────────────────────────────────
const IMAGE_INTENT_RE =
  /\b(generate|create|draw|make|render|imagine|show\s+me|design|paint|sketch|depict|visualize|illustrate)\b.{0,70}\b(image|photo|picture|art|artwork|illustration|portrait|wallpaper|logo|scene|landscape)\b|\b(image|photo|picture|art)\s+of\b|^(draw|paint|sketch)\s+(a\s+|an\s+|the\s+)?[a-z]/im

export function isImageRequest(text: string): boolean {
  return IMAGE_INTENT_RE.test(text.trim())
}

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
  agentId?: AgentId
  // Image fields
  type?: 'text' | 'image'
  image_url?: string | null
  prompt?: string | null
  image_style?: string
  image_generating?: boolean
  attachments?: string[]
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
  imageUsage: { used: number; limit: number }
}

const initialState: State = {
  chats: [],
  activeId: null,
  messages: [],
  loading: false,
  msgLoading: false,
  streaming: false,
  imageUsage: { used: 0, limit: 5 },
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
  | { type: 'ERROR_MSG'; payload: { id: string; message?: string } }
  | { type: 'REACT_MSG'; payload: { id: string; reaction: 'up' | 'down' | null } }
  | { type: 'SET_IMG_URL'; payload: { id: string; url: string; enhancedPrompt: string } }
  | { type: 'IMG_GEN_ERROR'; payload: { id: string; message: string } }
  | { type: 'SET_IMAGE_USAGE'; payload: { used: number; limit: number } }

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
      return { 
        ...state, 
        messages: state.messages.map(m => 
          m.id === action.payload.id 
            ? { ...m, streaming: false, error: true, content: action.payload.message || m.content } 
            : m
        ) 
      }
    case 'REACT_MSG':
      return { ...state, messages: state.messages.map(m => m.id === action.payload.id ? { ...m, reaction: action.payload.reaction } : m) }
    case 'SET_IMG_URL':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? { ...m, image_url: action.payload.url, prompt: action.payload.enhancedPrompt, image_generating: false }
            : m
        ),
      }
    case 'IMG_GEN_ERROR':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id
            ? { ...m, image_generating: false, error: true, content: action.payload.message }
            : m
        ),
      }
    case 'SET_IMAGE_USAGE':
      return { ...state, imageUsage: action.payload }
    default: return state
  }
}

// ── Available models ──────────────────────────────────────────────────────────
export const AVAILABLE_MODELS = [
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Kesari 1.2', provider: 'INTELLIVEX AI' },
]
const DEFAULT_MODEL = AVAILABLE_MODELS[0].id

// ── Context ───────────────────────────────────────────────────────────────────
interface ChatContextValue {
  state: State
  selectedModel: string
  setSelectedModel: (m: string) => void
  systemPrompt: string
  setSystemPrompt: (p: string) => void
  webSearchEnabled: boolean
  setWebSearchEnabled: (enabled: boolean) => void
  activeAgentId: AgentId
  setActiveAgentId: (id: AgentId) => void
  loadChats: () => Promise<void>
  selectChat: (id: string) => Promise<void>
  newChat: () => void
  sendMessage: (text: string, style?: string, attachments?: string[]) => Promise<void>
  generateImage: (prompt: string, style?: string) => Promise<void>
  stopStreaming: () => void
  regenerate: () => Promise<void>
  regenerateImage: (prompt: string, style?: string, messageId?: string) => Promise<void>
  deleteChat: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<void>
  reactToMessage: (id: string, reaction: 'up' | 'down' | null) => void
  branchChat: (messageId: string, newContent: string) => Promise<void>
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
    () => localStorage.getItem('kesari-system-prompt') || skillsPrompt
  )
  const setSystemPrompt = useCallback((p: string) => {
    localStorage.setItem('kesari-system-prompt', p)
    setSystemPromptState(p)
  }, [])

  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('kesari')

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

  // ── Image Generation Pipeline ─────────────────────────────────────────────
  const generateImage = useCallback(async (prompt: string, style?: string) => {
    let chatId = stateRef.current.activeId

    if (!chatId) {
      const title = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt
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
        const title = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt
        try {
          await apiRenameChat(chatId, title)
          dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { id: chatId, title } })
        } catch { /* non-critical */ }
      }
    }

    const currentChatId = chatId

    // Add user message to UI + DB
    const tempUserId = `temp-user-${Date.now()}`
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { id: tempUserId, chat_id: currentChatId, role: 'user', content: prompt, created_at: new Date().toISOString(), type: 'text' },
    })
    postMessage(currentChatId, 'user', prompt).catch(err => console.error('postMessage(user) error', err))

    // Add image placeholder
    const tempImgId = `temp-img-${Date.now()}`
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: tempImgId,
        chat_id: currentChatId,
        role: 'assistant',
        content: prompt,
        created_at: new Date().toISOString(),
        type: 'image',
        image_generating: true,
        prompt,
        image_style: style,
      },
    })

    try {
      const result = await apiGenerateImage(currentChatId, prompt, style)

      dispatch({
        type: 'SET_IMG_URL',
        payload: { id: tempImgId, url: result.url, enhancedPrompt: result.enhancedPrompt },
      })
      dispatch({
        type: 'SET_IMAGE_USAGE',
        payload: { used: result.used, limit: result.limit },
      })

      // Reload messages from DB to get the persisted image message ID
      setTimeout(async () => {
        try {
          const msgs = await fetchMessages(currentChatId)
          if (msgs.length > 0) dispatch({ type: 'SET_MESSAGES', payload: msgs as UIMessage[] })
        } catch { /* silent */ }
      }, 600)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Image generation failed'
      dispatch({ type: 'IMG_GEN_ERROR', payload: { id: tempImgId, message } })
    }
  }, [])

  // ── Regenerate image (same prompt, new variation) ─────────────────────────
  const regenerateImage = useCallback(async (prompt: string, style?: string, messageId?: string) => {
    // Replace the old image message with a fresh generating placeholder
    if (messageId) {
      dispatch({
        type: 'SET_IMG_URL',
        // temporarily clear image_url to trigger skeleton
        payload: { id: messageId, url: '', enhancedPrompt: prompt },
      })
      // set generating=true
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: `regen-${Date.now()}`,
          chat_id: stateRef.current.activeId ?? '',
          role: 'assistant',
          content: prompt,
          created_at: new Date().toISOString(),
          type: 'image',
          image_generating: true,
          prompt,
          image_style: style,
        },
      })
    }
    await generateImage(prompt, style)
  }, [generateImage])

  const sendMessage = useCallback(async (text: string, style?: string, attachments?: string[]) => {
    // Parse @Agent mentions (e.g. "@coder write a React hook")
    const { agentId: mentionedAgent, cleanText } = parseAgentMention(text)
    const resolvedAgentId = mentionedAgent ?? activeAgentId
    const resolvedAgent = AGENTS[resolvedAgentId]
    const finalText = cleanText

    // Route to image pipeline if intent detected
    if (isImageRequest(finalText) && (!attachments || attachments.length === 0)) {
      await generateImage(finalText, style)
      return
    }

    let chatId = stateRef.current.activeId

    if (!chatId) {
      const title = finalText.length > 60 ? finalText.slice(0, 60) + '…' : finalText
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
        const title = finalText.length > 60 ? finalText.slice(0, 60) + '…' : finalText
        try {
          await apiRenameChat(chatId, title)
          dispatch({ type: 'UPDATE_CHAT_TITLE', payload: { id: chatId, title } })
        } catch { /* non-critical */ }
      }
    }

    const tempUserId = `temp-user-${Date.now()}`
    dispatch({ type: 'ADD_MESSAGE', payload: { id: tempUserId, chat_id: chatId, role: 'user', content: text, created_at: new Date().toISOString(), attachments } })

    const tempAiId = `temp-ai-${Date.now()}`
    dispatch({ type: 'ADD_MESSAGE', payload: { id: tempAiId, chat_id: chatId, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true, agentId: resolvedAgentId } })
    dispatch({ type: 'SET_STREAMING', payload: true })

    // Build context: all non-streaming messages + new user message
    const contextMessages = stateRef.current.messages
      .filter(m => !m.streaming && !m.error && m.type !== 'image')
      .map(m => ({ role: m.role, content: m.content, attachments: m.attachments }))
    contextMessages.push({ role: 'user', content: finalText, attachments })

    const currentChatId = chatId

    postMessage(currentChatId, 'user', text, attachments).catch(err => console.error('postMessage(user) error', err))

    const controller = new AbortController()
    abortRef.current = controller

    // Build effective system prompt: base + agent overlay
    const basePrompt = localStorage.getItem('kesari-system-prompt') || skillsPrompt
    const effectivePrompt = resolvedAgent.systemPromptOverlay
      ? `${basePrompt}\n\n${resolvedAgent.systemPromptOverlay}`
      : basePrompt

    // ── Word-by-word smooth streaming (throttled at ~60fps) ──────────────────
    let accumulated = ''
    let pendingFlush: ReturnType<typeof setTimeout> | null = null

    const flushToUI = () => {
      pendingFlush = null
      dispatch({ type: 'UPDATE_MSG_CONTENT', payload: { id: tempAiId, content: accumulated, streaming: true } })
    }

    await streamChat({
      chatId: currentChatId,
      messages: contextMessages,
      model: localStorage.getItem('kesari-model') ?? DEFAULT_MODEL,
      systemPrompt: stateRef.current.streaming ? undefined : effectivePrompt,
      webSearch: stateRef.current.activeId ? webSearchEnabled : undefined,
      signal: controller.signal,

      onToken: (token) => {
        accumulated += token
        if (!pendingFlush) {
          pendingFlush = setTimeout(flushToUI, 16)
        }
      },

      onDone: async (fullContent) => {
        if (pendingFlush) { clearTimeout(pendingFlush); pendingFlush = null }
        abortRef.current = null
        dispatch({ type: 'FINALIZE_MSG', payload: { id: tempAiId, content: fullContent || accumulated } })
        dispatch({ type: 'SET_STREAMING', payload: false })
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
        dispatch({ type: 'ERROR_MSG', payload: { id: tempAiId, message: err.message } })
        dispatch({ type: 'SET_STREAMING', payload: false })
      },
    })
  }, [generateImage, activeAgentId, webSearchEnabled])


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
  }, [generateImage])

  // ── Branch Chat ─────────────────────────────────────────────────────────────
  const branchChat = useCallback(async (messageId: string, newContent: string) => {
    const activeId = stateRef.current.activeId
    if (!activeId) return
    const msgs = stateRef.current.messages
    const idx = msgs.findIndex(m => m.id === messageId)
    if (idx === -1) return

    // Keep all messages *before* the edited one
    const preserved = msgs.slice(0, idx)
    dispatch({ type: 'SET_MESSAGES', payload: preserved })
    
    // We ideally should delete subsequent messages from backend, but for speed,
    // we'll just not show them. Sending this new sequence creates a fork logically,
    // though the DB might still hold the old ones without a proper "delete cascading" API.
    // For now, we just visually prune and re-send.
    await sendMessage(newContent, undefined, msgs[idx].attachments)
  }, [sendMessage])

  return (
    <ChatContext.Provider
      value={{
        state,
        selectedModel,
        setSelectedModel,
        systemPrompt,
        setSystemPrompt,
        webSearchEnabled,
        setWebSearchEnabled,
        activeAgentId,
        setActiveAgentId,
        loadChats,
        selectChat,
        newChat,
        sendMessage,
        generateImage,
        stopStreaming,
        regenerate,
        regenerateImage,
        deleteChat,
        renameChat,
        reactToMessage,
        branchChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
