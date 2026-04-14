import { useCallback, useMemo } from 'react'
import { useConversationStorage } from '../hooks'
import type { ConversationPreview, Message } from './ChatComponentTypes'

const STORAGE_KEY = 'sr:chat:conversations'
const MAX_CONVERSATIONS = 20
const PREVIEW_MAX_LEN = 60

export function useChatConversationStorage() {
  const { conversations, saveConversation, getConversation, deleteConversation } =
    useConversationStorage<Message[]>({
      storageKey: STORAGE_KEY,
      maxConversations: MAX_CONVERSATIONS,
    })

  const restoreMessages = useCallback((payload: Message[]): Message[] => {
    return payload.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }))
  }, [])

  const getStoredMessagesForConversation = useCallback((id: string): Message[] => {
    const storedConversation = getConversation(id)
    if (!storedConversation?.payload || !Array.isArray(storedConversation.payload)) {
      return []
    }
    return restoreMessages(storedConversation.payload)
  }, [getConversation, restoreMessages])

  const conversationPreviews = useMemo<ConversationPreview[]>(() => {
    return [...conversations]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(conv => {
        const firstUserMessage = Array.isArray(conv.payload)
          ? conv.payload.find(msg => msg.role === 'user')
          : undefined
        const title = (firstUserMessage?.content || 'New conversation').trim()
        const preview = title.length > PREVIEW_MAX_LEN
          ? `${title.slice(0, PREVIEW_MAX_LEN)}…`
          : title || 'New conversation'

        return {
          id: conv.id,
          updatedAt: conv.updatedAt || conv.createdAt,
          preview,
        }
      })
  }, [conversations])

  return {
    conversations,
    saveConversation,
    getConversation,
    deleteConversation,
    restoreMessages,
    getStoredMessagesForConversation,
    conversationPreviews,
  }
}
