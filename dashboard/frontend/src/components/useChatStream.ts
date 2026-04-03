import { useCallback, useRef } from 'react'
import {
  buildChoicesArray,
  getFirstChoice,
  isEventStreamContentType,
  mergeParsedChoices,
  parseChatCompletionPayload,
  type ChoiceAccumulator,
  type ParsedChatCompletion,
  type ParsedToolCallChunk,
} from './chatResponseParsing'
import {
  buildChatMessages,
  buildChatRequestBody,
  collectResponseHeaders,
} from './chatRequestSupport'
import {
  type Choice,
  generateMessageId,
  type Message,
  type ReMoMRoundResponse,
} from './ChatComponentTypes'
import type { ToolCall } from '../tools'
import type {
  ChatStreamCallbacks,
  ChatToolDefinition,
  ChatToolExecutor,
} from './chatStreamShared'
import { runChatToolLoop } from './chatStreamToolLoop'

interface ChatStreamOptions {
  endpoint: string
  model: string
  messages: Message[]
  enableWebSearch: boolean
  enableClawMode: boolean
  clawManagementDisabled: boolean
  searchToolDefinitions: ChatToolDefinition[]
  activeOtherToolDefinitions: ChatToolDefinition[]
  executeTools: ChatToolExecutor
}

export function useChatStream(
  options: ChatStreamOptions,
  callbacks: ChatStreamCallbacks,
) {
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    callbacks.setIsLoading(false)
  }, [callbacks])

  const handleSend = useCallback(async (inputValue: string) => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) return

    callbacks.setError(null)
    const generateId = generateMessageId

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    }

    callbacks.setMessages(prev => [...prev, userMessage])
    callbacks.setIsLoading(true)

    callbacks.setPendingHeaders(null)
    callbacks.setShowHeaderReveal(false)
    callbacks.setShowThinking(true)

    const assistantMessageId = generateId()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    callbacks.setMessages(prev => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()

      const activeTools = [
        ...options.activeOtherToolDefinitions,
        ...(options.enableWebSearch ? options.searchToolDefinitions : []),
      ]
      const chatMessages = buildChatMessages(
        options.messages,
        trimmedInput,
        options.enableClawMode && !options.clawManagementDisabled
      )
      const requestBody = buildChatRequestBody(options.model, chatMessages, activeTools)

      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const responseHeaders = collectResponseHeaders(response)

      if (Object.keys(responseHeaders).length > 0) {
        console.log('Headers received, showing HeaderReveal')
        callbacks.setPendingHeaders(responseHeaders)
        callbacks.setShowThinking(false)
        callbacks.setShowHeaderReveal(true)
      }

      const choiceContents: Map<number, ChoiceAccumulator> = new Map()
      let isRatingsMode = false
      const toolCallsMap: Map<number, ToolCall> = new Map()
      let hasToolCalls = false
      let reasoningMomResponses: ReMoMRoundResponse[] | undefined
      let latestThinkingProcess = ''

      const syncAssistantToolCalls = () => {
        const currentToolCalls = Array.from(toolCallsMap.values())
        callbacks.setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? { ...m, toolCalls: currentToolCalls }
              : m
          )
        )
      }

      const mergeToolCallsIntoState = (
        parsedToolCalls: ParsedToolCallChunk[],
        idPrefix: string,
        status: ToolCall['status']
      ) => {
        if (parsedToolCalls.length === 0) return false

        hasToolCalls = true

        for (const parsedToolCall of parsedToolCalls) {
          const toolCallIndex = parsedToolCall.index
          if (!toolCallsMap.has(toolCallIndex)) {
            toolCallsMap.set(toolCallIndex, {
              id: parsedToolCall.id || `${idPrefix}-${toolCallIndex}`,
              type: 'function',
              function: {
                name: parsedToolCall.functionName || '',
                arguments: ''
              },
              status,
            })
          }

          const existingToolCall = toolCallsMap.get(toolCallIndex)!
          existingToolCall.status = status

          if (parsedToolCall.functionName) {
            existingToolCall.function.name = parsedToolCall.functionName
          }

          if (parsedToolCall.functionArguments) {
            existingToolCall.function.arguments += parsedToolCall.functionArguments
          }

          if (parsedToolCall.id) {
            existingToolCall.id = parsedToolCall.id
          }
        }

        return true
      }

      const syncAssistantChoices = (streaming: boolean) => {
        if (hasToolCalls && !getFirstChoice(choiceContents)?.content) return

        if (isRatingsMode) {
          const choicesArray = buildChoicesArray(choiceContents)
          const thinkingProcess = getFirstChoice(choiceContents)?.reasoningContent || latestThinkingProcess

          if (thinkingProcess) {
            latestThinkingProcess = thinkingProcess
          }

          callbacks.setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessageId
                ? {
                  ...m,
                  content: choicesArray[0]?.content || '',
                  choices: choicesArray,
                  thinkingProcess: thinkingProcess || m.thinkingProcess,
                  isStreaming: streaming,
                }
                : m
            )
          )
          return
        }

        const firstChoice = getFirstChoice(choiceContents)
        if (!firstChoice) return

        if (firstChoice.reasoningContent) {
          latestThinkingProcess = firstChoice.reasoningContent
        }

        callbacks.setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? {
                ...m,
                content: firstChoice.content,
                thinkingProcess: firstChoice.reasoningContent || m.thinkingProcess,
                isStreaming: streaming,
              }
              : m
          )
        )
      }

      const applyParsedCompletion = (parsedCompletion: ParsedChatCompletion, streaming: boolean) => {
        if (parsedCompletion.reasoningMomResponses) {
          reasoningMomResponses = parsedCompletion.reasoningMomResponses
          console.log('[ReMoM] Extracted reasoning_mom_responses:', reasoningMomResponses)
        }

        if (parsedCompletion.choices.length > 1) {
          isRatingsMode = true
        }

        mergeParsedChoices(choiceContents, parsedCompletion.choices)

        let shouldSyncToolCalls = false
        for (const parsedChoice of parsedCompletion.choices) {
          if (mergeToolCallsIntoState(parsedChoice.toolCalls, 'tool', streaming ? 'running' : 'pending')) {
            shouldSyncToolCalls = true
          }
        }

        if (shouldSyncToolCalls) {
          syncAssistantToolCalls()
        }

        syncAssistantChoices(streaming)
      }

      if (!isEventStreamContentType(response.headers.get('content-type'))) {
        const responseText = await response.text()
        const parsedResponse = parseChatCompletionPayload(responseText)

        if (!parsedResponse) {
          throw new Error('Invalid JSON response')
        }

        if (parsedResponse.errorMessage) {
          throw new Error(parsedResponse.errorMessage)
        }

        if (parsedResponse.choices.length === 0) {
          throw new Error('No choices in response')
        }

        applyParsedCompletion(parsedResponse, false)
      } else {
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          const lines = buffer.split('\n')

          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            const parsedChunk = parseChatCompletionPayload(data)
            if (!parsedChunk) continue

            if (parsedChunk.errorMessage) {
              throw new Error(parsedChunk.errorMessage)
            }

            applyParsedCompletion(parsedChunk, true)
          }
        }
      }

      // If we had tool calls, execute tools in a loop until model gives final answer
      if (hasToolCalls) {
        latestThinkingProcess = await runChatToolLoop({
          abortControllerRef,
          activeTools,
          assistantMessageId,
          callbacks,
          chatMessages,
          endpoint: options.endpoint,
          executeTools: options.executeTools,
          initialToolCalls: Array.from(toolCallsMap.values()),
          latestThinkingProcess,
          mergeToolCallsIntoState,
          model: options.model,
          syncAssistantToolCalls,
          toolCallsMap,
        })
      }

      // Finalize message
      const finalChoices: Choice[] | undefined = isRatingsMode
        ? buildChoicesArray(choiceContents)
        : undefined

      const finalThinkingProcess = latestThinkingProcess || getFirstChoice(choiceContents)?.reasoningContent || ''

      console.log('[ReMoM] Setting reasoning_mom_responses:', reasoningMomResponses)
      callbacks.setShowThinking(false)
      callbacks.setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId
            ? {
              ...m,
              isStreaming: false,
              headers: Object.keys(responseHeaders).length > 0 ? responseHeaders : undefined,
              choices: finalChoices,
              thinkingProcess: finalThinkingProcess || m.thinkingProcess,
              reasoning_mom_responses: reasoningMomResponses
            }
            : m
        )
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      callbacks.setError(errorMessage)
      callbacks.setMessages(prev => prev.filter(m => m.id !== assistantMessageId))
    } finally {
      callbacks.setIsLoading(false)
      callbacks.setShowThinking(false)
      abortControllerRef.current = null
    }
  }, [options, callbacks])

  return { handleSend, handleStop, abortControllerRef }
}
