import type {
  KeyboardEventHandler,
  ReactNode,
  Ref,
} from 'react'

import styles from './ChatComponent.module.css'
import ClawRoomChat from './ClawRoomChat'
import { ClawModeToggle } from './ChatComponentControls'
import ChatConversationSidebar from './ChatConversationSidebar'
import ChatComponentConversationViewport from './ChatComponentConversationViewport'
import ChatComponentInputBar from './ChatComponentInputBar'
import ChatComponentSidebarShell from './ChatComponentSidebarShell'
import type {
  ConversationPreview,
  Message,
} from './ChatComponentTypes'

interface ChatComponentShellProps {
  conversationId: string
  conversationPreviews: ConversationPreview[]
  createDisabled: boolean
  enableClawMode: boolean
  enableWebSearch: boolean
  error: string | null
  expandedToolCards: Set<string>
  inputRef: Ref<HTMLTextAreaElement>
  inputValue: string
  isFullscreen: boolean
  isLoading: boolean
  isSidebarOpen: boolean
  isTeamRoomView: boolean
  isTogglingClawMode: boolean
  messages: Message[]
  modeToggleDisabled: boolean
  onChangeInput: (value: string) => void
  onCreate: () => void
  onDeleteConversation: (id: string) => void
  onDismissError: () => void
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>
  onSelectConversation: (id: string) => void
  onSend: () => void
  onStop: () => void
  onToggleClawMode: () => void
  onToggleSidebar: () => void
  onToggleToolCard: (toolCallId: string) => void
  onToggleWebSearch: () => void
  roomChatToggleControl: ReactNode
  teamRoomCreateToken: number
}

export default function ChatComponentShell({
  conversationId,
  conversationPreviews,
  createDisabled,
  enableClawMode,
  enableWebSearch,
  error,
  expandedToolCards,
  inputRef,
  inputValue,
  isFullscreen,
  isLoading,
  isSidebarOpen,
  isTeamRoomView,
  isTogglingClawMode,
  messages,
  modeToggleDisabled,
  onChangeInput,
  onCreate,
  onDeleteConversation,
  onDismissError,
  onKeyDown,
  onSelectConversation,
  onSend,
  onStop,
  onToggleClawMode,
  onToggleSidebar,
  onToggleToolCard,
  onToggleWebSearch,
  roomChatToggleControl,
  teamRoomCreateToken,
}: ChatComponentShellProps) {
  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.mainLayout}>
        <ChatComponentSidebarShell
          createDisabled={createDisabled}
          isOpen={isSidebarOpen}
          isTeamRoomView={isTeamRoomView}
          onCreate={onCreate}
          onToggleSidebar={onToggleSidebar}
        >
          {!isTeamRoomView ? (
            <ChatConversationSidebar
              conversationId={conversationId}
              conversationPreviews={conversationPreviews}
              onDeleteConversation={onDeleteConversation}
              onSelectConversation={onSelectConversation}
            />
          ) : null}
        </ChatComponentSidebarShell>

        <div className={styles.chatArea}>
          {isTeamRoomView ? (
            <ClawRoomChat
              isSidebarOpen={isSidebarOpen}
              createRoomRequestToken={teamRoomCreateToken}
              inputModeControls={(
                <>
                  <button
                    type="button"
                    className={`${styles.inputActionButton} ${styles.searchToggleActive}`}
                    onClick={event => event.preventDefault()}
                    data-tooltip="Web Search enabled in Room Chat"
                    aria-label="Web Search enabled in Room Chat"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </button>
                  <ClawModeToggle
                    enabled={enableClawMode}
                    onToggle={onToggleClawMode}
                    disabled={modeToggleDisabled}
                  />
                  {roomChatToggleControl}
                </>
              )}
            />
          ) : (
            <>
              {error ? (
                <div className={styles.error}>
                  <span className={styles.errorIcon}>⚠️</span>
                  <span>{error}</span>
                  <button
                    className={styles.errorDismiss}
                    onClick={onDismissError}
                  >
                    ×
                  </button>
                </div>
              ) : null}
              <ChatComponentConversationViewport
                expandedToolCards={expandedToolCards}
                messages={messages}
                onToggleToolCard={onToggleToolCard}
              />
              <ChatComponentInputBar
                enableClawMode={enableClawMode}
                enableWebSearch={enableWebSearch}
                inputRef={inputRef}
                inputValue={inputValue}
                isLoading={isLoading}
                isTogglingClawMode={isTogglingClawMode}
                modeToggleDisabled={modeToggleDisabled}
                onChangeInput={onChangeInput}
                onKeyDown={onKeyDown}
                onSend={onSend}
                onStop={onStop}
                onToggleClawMode={onToggleClawMode}
                onToggleWebSearch={onToggleWebSearch}
                roomChatToggleControl={roomChatToggleControl}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
