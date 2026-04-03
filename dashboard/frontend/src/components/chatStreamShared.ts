import type { Message } from './ChatComponentTypes'
import type { ToolCall, ToolResult } from '../tools'

export interface ChatToolDefinition {
  type: string
  function: {
    name: string
    description: string
    parameters: unknown
  }
}

export interface ChatStreamCallbacks {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setIsLoading: (v: boolean) => void
  setError: (v: string | null) => void
  setShowThinking: (v: boolean) => void
  setPendingHeaders: (v: Record<string, string> | null) => void
  setShowHeaderReveal: (v: boolean) => void
  setExpandedToolCards: React.Dispatch<React.SetStateAction<Set<string>>>
}

export interface ChatToolExecutor {
  (toolCalls: ToolCall[], options?: { signal?: AbortSignal }): Promise<ToolResult[]>
}
