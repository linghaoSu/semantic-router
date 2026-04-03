import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ThinkingAnimation from './ThinkingAnimation'
import HeaderReveal from './HeaderReveal'
import ChatComponentRoomToggle from './ChatComponentRoomToggle'
import ChatComponentShell from './ChatComponentShell'
import {
  CLAW_MODE_STORAGE_KEY,
  CLAW_TOOL_NAME_PREFIX,
  type ConversationPreview,
  generateConversationId,
  type Message,
} from './ChatComponentTypes'
import { useToolRegistry } from '../tools'
import { useMCPToolSync } from '../tools/mcp'
import { ensureOpenClawServerConnected } from '../tools/mcp/api'
import { useConversationStorage } from '../hooks'
import { useReadonly } from '../contexts/ReadonlyContext'
import { useChatStream } from './useChatStream'

interface ChatComponentProps {
  endpoint?: string
  isFullscreenMode?: boolean
}

type ClawPlaygroundView = 'control' | 'room'

const ChatComponent = ({
  endpoint = '/api/router/v1/chat/completions',
  isFullscreenMode = false,
}: ChatComponentProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string>(() => generateConversationId())
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const model = 'MoM' // Fixed to MoM
  const [error, setError] = useState<string | null>(null)
  const [showThinking, setShowThinking] = useState(false)
  const [showHeaderReveal, setShowHeaderReveal] = useState(false)
  const [pendingHeaders, setPendingHeaders] = useState<Record<string, string> | null>(null)
  const [isFullscreen] = useState(isFullscreenMode)
  const [enableWebSearch, setEnableWebSearch] = useState(true)
  const [enableClawMode, setEnableClawMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = window.localStorage.getItem(CLAW_MODE_STORAGE_KEY)
    if (saved === null) return true
    return saved === 'true'
  })
  const [isTogglingClawMode, setIsTogglingClawMode] = useState(false)
  const [expandedToolCards, setExpandedToolCards] = useState<Set<string>>(new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clawView, setClawView] = useState<ClawPlaygroundView>(() => 'control')
  const [teamRoomCreateToken, setTeamRoomCreateToken] = useState(0)
  const { isReadonly, isLoading: readonlyLoading } = useReadonly()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasHydratedConversation = useRef(false)

  const { conversations, saveConversation, getConversation, deleteConversation } = useConversationStorage<Message[]>({
    storageKey: 'sr:chat:conversations',
    maxConversations: 20,
  })

  const restoreMessages = useCallback((payload: Message[]) => {
    return payload.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }))
  }, [])
  const { refresh: refreshMCPTools } = useMCPToolSync({ enabled: true, pollInterval: 30000 })
  const { definitions: searchToolDefinitions } = useToolRegistry({
    enabledOnly: true,
    categories: ['search'],
  })
  const { definitions: otherToolDefinitions, executeAll: executeTools } = useToolRegistry({
    enabledOnly: true,
    categories: ['code', 'file', 'image', 'custom'],
  })

  const baseOtherToolDefinitions = useMemo(
    () => otherToolDefinitions.filter(def => !def.function.name.startsWith(CLAW_TOOL_NAME_PREFIX)),
    [otherToolDefinitions]
  )
  const clawToolDefinitions = useMemo(
    () => otherToolDefinitions.filter(def => def.function.name.startsWith(CLAW_TOOL_NAME_PREFIX)),
    [otherToolDefinitions]
  )
  const clawManagementDisabled = readonlyLoading || isReadonly
  const activeOtherToolDefinitions = useMemo(
    () => (
      enableClawMode && !clawManagementDisabled
        ? [...baseOtherToolDefinitions, ...clawToolDefinitions]
        : baseOtherToolDefinitions
    ),
    [baseOtherToolDefinitions, clawManagementDisabled, clawToolDefinitions, enableClawMode]
  )
  const { handleSend, handleStop, abortControllerRef } = useChatStream(
    {
      endpoint,
      model,
      messages,
      enableWebSearch,
      enableClawMode,
      clawManagementDisabled,
      searchToolDefinitions,
      activeOtherToolDefinitions,
      executeTools,
    },
    {
      setMessages,
      setIsLoading,
      setError,
      setShowThinking,
      setPendingHeaders,
      setShowHeaderReveal,
      setExpandedToolCards,
    },
  )
  useEffect(() => {
    if (pendingHeaders && Object.keys(pendingHeaders).length > 0) {
      setShowHeaderReveal(true)
    }
  }, [pendingHeaders])
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('playground-fullscreen')
    } else {
      document.body.classList.remove('playground-fullscreen')
    }

    return () => {
      document.body.classList.remove('playground-fullscreen')
    }
  }, [isFullscreen])
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CLAW_MODE_STORAGE_KEY, String(enableClawMode))
  }, [enableClawMode])

  useEffect(() => {
    if (!enableClawMode) {
      setIsTogglingClawMode(false)
      setClawView('control')
      return
    }
    if (clawManagementDisabled) {
      setIsTogglingClawMode(false)
      return
    }

    let isCurrent = true
    const bootstrapClawTools = async () => {
      setIsTogglingClawMode(true)
      try {
        await ensureOpenClawServerConnected()
        await refreshMCPTools()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to enable Claw Mode'
        console.warn(`[ClawOS] UI mode enabled, but MCP bootstrap failed: ${message}`)
      } finally {
        if (isCurrent) {
          setIsTogglingClawMode(false)
        }
      }
    }

    void bootstrapClawTools()

    return () => {
      isCurrent = false
    }
  }, [clawManagementDisabled, enableClawMode, refreshMCPTools])

  useEffect(() => {
    if (enableClawMode && clawView === 'room') {
      setIsSidebarOpen(false)
    }
  }, [enableClawMode, clawView])

  // Hydrate the most recent conversation from localStorage once
  useEffect(() => {
    if (hasHydratedConversation.current) return

    if (conversations.length === 0) return

    const latestConversation = getConversation()
    if (latestConversation?.payload && Array.isArray(latestConversation.payload)) {
      setConversationId(latestConversation.id)
      setMessages(restoreMessages(latestConversation.payload))
    }

    hasHydratedConversation.current = true
  }, [conversations, getConversation, restoreMessages])

  // Persist conversation whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    saveConversation(conversationId, messages)
  }, [conversationId, messages, saveConversation])

  const conversationPreviews = useMemo<ConversationPreview[]>(() => {
    return [...conversations]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(conv => {
        const firstUserMessage = Array.isArray(conv.payload)
          ? conv.payload.find(msg => msg.role === 'user')
          : undefined
        const title = (firstUserMessage?.content || 'New conversation').trim()
        const preview = title.length > 60 ? `${title.slice(0, 60)}…` : title || 'New conversation'

        return {
          id: conv.id,
          updatedAt: conv.updatedAt || conv.createdAt,
          preview,
        }
      })
  }, [conversations])

  const handleThinkingComplete = useCallback(() => {}, [])

  const handleHeaderRevealComplete = useCallback(() => {
    setShowHeaderReveal(false)
    setPendingHeaders(null)
  }, [])

  const handleSelectConversation = useCallback(
    (id: string) => {
      const target = conversations.find(conv => conv.id === id)
      if (!target) return

      abortControllerRef.current?.abort()
      setIsLoading(false)
      setConversationId(target.id)
      setMessages(restoreMessages(Array.isArray(target.payload) ? target.payload : []))
      setInputValue('')
      setError(null)
      setPendingHeaders(null)
      setShowHeaderReveal(false)
      setShowThinking(false)
      setExpandedToolCards(new Set())
    },
    [abortControllerRef, conversations, restoreMessages]
  )

  const handleDeleteConversation = useCallback(
    (id: string) => {
      const remaining = conversations.filter(conv => conv.id !== id)

      deleteConversation(id)

      if (id === conversationId) {
        abortControllerRef.current?.abort()
        setIsLoading(false)
        setError(null)
        setPendingHeaders(null)
        setShowHeaderReveal(false)
        setShowThinking(false)
        setExpandedToolCards(new Set())
        setInputValue('')

        const next = remaining[0]
        if (next && Array.isArray(next.payload)) {
          setConversationId(next.id)
          setMessages(restoreMessages(next.payload))
        } else {
          setConversationId(generateConversationId())
          setMessages([])
        }
      }
    },
    [abortControllerRef, conversationId, conversations, deleteConversation, restoreMessages]
  )

  const onSend = useCallback(async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isLoading) return
    setInputValue('')
    await handleSend(trimmedInput)
  }, [inputValue, isLoading, handleSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleNewConversation = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
    setMessages([])
    setError(null)
    setPendingHeaders(null)
    setShowHeaderReveal(false)
    setShowThinking(false)
    setExpandedToolCards(new Set())
    setInputValue('')
    setConversationId(generateConversationId())
  }, [abortControllerRef])

  const handleToggleClawMode = useCallback(() => {
    if (isLoading || isTogglingClawMode) return
    if (enableClawMode) {
      setEnableClawMode(false)
      setError(null)
      return
    }
    setEnableClawMode(true)
    setError(null)
  }, [enableClawMode, isLoading, isTogglingClawMode])

  const isTeamRoomView = enableClawMode && clawView === 'room', roomCreateDisabled = isTeamRoomView && clawManagementDisabled
  const modeToggleDisabled = isLoading || isTogglingClawMode || readonlyLoading

  const handleToggleTeamView = useCallback(() => { if (!enableClawMode || modeToggleDisabled) return; setClawView(prev => (prev === 'room' ? 'control' : 'room')) }, [enableClawMode, modeToggleDisabled])

  const handleTopBarCreate = useCallback(() => {
    if (roomCreateDisabled) return
    if (isTeamRoomView) {
      setTeamRoomCreateToken(prev => prev + 1)
      return
    }
    handleNewConversation()
  }, [handleNewConversation, isTeamRoomView, roomCreateDisabled])

  const handleToggleToolCard = useCallback((toolCallId: string) => {
    setExpandedToolCards(prev => {
      const next = new Set(prev)
      if (next.has(toolCallId)) {
        next.delete(toolCallId)
      } else {
        next.add(toolCallId)
      }
      return next
    })
  }, [])

  const roomChatToggleControl = enableClawMode
    ? <ChatComponentRoomToggle disabled={modeToggleDisabled} isTeamRoomView={isTeamRoomView} onToggle={handleToggleTeamView} />
    : null
  const liveThinkingProcess = messages.reduceRight((thinking, message) =>
    thinking || (message.role === 'assistant' && message.isStreaming ? message.thinkingProcess || '' : ''), '')

  return (
    <>
      {showThinking && (
        <ThinkingAnimation
          onComplete={handleThinkingComplete}
          thinkingProcess={liveThinkingProcess}
        />
      )}

      {showHeaderReveal && pendingHeaders && (
        <HeaderReveal
          headers={pendingHeaders}
          onComplete={handleHeaderRevealComplete}
          displayDuration={2000}
        />
      )}

      <ChatComponentShell
        conversationId={conversationId}
        conversationPreviews={conversationPreviews}
        createDisabled={roomCreateDisabled}
        enableClawMode={enableClawMode}
        enableWebSearch={enableWebSearch}
        error={error}
        expandedToolCards={expandedToolCards}
        inputRef={inputRef}
        inputValue={inputValue}
        isFullscreen={isFullscreen}
        isLoading={isLoading}
        isSidebarOpen={isSidebarOpen}
        isTeamRoomView={isTeamRoomView}
        isTogglingClawMode={isTogglingClawMode}
        messages={messages}
        modeToggleDisabled={modeToggleDisabled}
        onChangeInput={setInputValue}
        onCreate={handleTopBarCreate}
        onDeleteConversation={handleDeleteConversation}
        onDismissError={() => setError(null)}
        onKeyDown={handleKeyDown}
        onSelectConversation={handleSelectConversation}
        onSend={onSend}
        onStop={handleStop}
        onToggleClawMode={handleToggleClawMode}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onToggleToolCard={handleToggleToolCard}
        onToggleWebSearch={() => setEnableWebSearch(prev => !prev)}
        roomChatToggleControl={roomChatToggleControl}
        teamRoomCreateToken={teamRoomCreateToken}
      />
    </>
  )
}

export default ChatComponent
