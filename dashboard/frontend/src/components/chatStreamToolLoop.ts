import type { MutableRefObject } from 'react'

import {
  isEventStreamContentType,
  parseChatCompletionPayload,
  type ParsedChatCompletion,
  type ParsedToolCallChunk,
} from './chatResponseParsing'
import type { OutboundChatMessage } from './chatRequestSupport'
import type { Message } from './ChatComponentTypes'
import type { ToolCall, ToolResult } from '../tools'
import type {
  ChatStreamCallbacks,
  ChatToolDefinition,
  ChatToolExecutor,
} from './chatStreamShared'

interface RunChatToolLoopArgs {
  abortControllerRef: MutableRefObject<AbortController | null>
  activeTools: ChatToolDefinition[]
  assistantMessageId: string
  callbacks: ChatStreamCallbacks
  chatMessages: OutboundChatMessage[]
  endpoint: string
  executeTools: ChatToolExecutor
  initialToolCalls: ToolCall[]
  latestThinkingProcess: string
  mergeToolCallsIntoState: (
    parsedToolCalls: ParsedToolCallChunk[],
    idPrefix: string,
    status: ToolCall['status'],
  ) => boolean
  model: string
  syncAssistantToolCalls: () => void
  toolCallsMap: Map<number, ToolCall>
}

function buildFallbackContent(allToolResults: ToolResult[]) {
  if (allToolResults.length === 0) {
    return '模型没有生成响应内容，请尝试重新提问。'
  }

  const successResults = allToolResults.filter(tr => !tr.error)
  const failedResults = allToolResults.filter(tr => tr.error)

  if (successResults.length > 0) {
    let fallbackContent = '基于搜索结果，以下是相关信息：\n\n'
    for (const tr of successResults) {
      if (typeof tr.content === 'string' && tr.content.length > 0) {
        const summary = tr.content.length > 500
          ? tr.content.substring(0, 500) + '...'
          : tr.content
        fallbackContent += summary + '\n\n'
      }
    }
    return fallbackContent
  }

  if (failedResults.length > 0) {
    return '抱歉，部分工具执行失败。请尝试重新查询或使用其他关键词。'
  }

  return '模型没有生成响应内容，请尝试重新提问。'
}

function updateAssistantMessage(
  callbacks: ChatStreamCallbacks,
  assistantMessageId: string,
  updater: (message: Message) => Message,
) {
  callbacks.setMessages(prev =>
    prev.map(message =>
      message.id === assistantMessageId ? updater(message as Message) : message
    )
  )
}

function buildToolMessages(toolResults: ToolResult[], currentToolCalls: ToolCall[]) {
  return [
    {
      role: 'assistant',
      content: null,
      tool_calls: currentToolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    },
    ...toolResults.map((tr) => {
      const MAX_TOOL_RESULT_LENGTH = 15000
      let content = typeof tr.content === 'string'
        ? tr.content
        : JSON.stringify(tr.content)

      if (content.length > MAX_TOOL_RESULT_LENGTH) {
        content = content.substring(0, MAX_TOOL_RESULT_LENGTH) + '\n\n...[Content truncated due to length]'
        console.log(`Tool result for ${tr.name} truncated from ${typeof tr.content === 'string' ? tr.content.length : JSON.stringify(tr.content).length} to ${MAX_TOOL_RESULT_LENGTH} chars`)
      }

      return {
        role: 'tool',
        tool_call_id: tr.callId,
        content,
      }
    }),
  ] as OutboundChatMessage[]
}

async function consumeFollowUpResponse(
  followUpResponse: Response,
  applyFollowUpCompletion: (parsedCompletion: ParsedChatCompletion, streaming: boolean) => void,
) {
  if (!isEventStreamContentType(followUpResponse.headers.get('content-type'))) {
    const followUpText = await followUpResponse.text()
    const parsedFollowUp = parseChatCompletionPayload(followUpText)

    if (parsedFollowUp?.errorMessage) {
      console.error('Follow-up API call returned an error:', parsedFollowUp.errorMessage)
      return
    }

    if (parsedFollowUp && parsedFollowUp.choices.length > 0) {
      applyFollowUpCompletion(parsedFollowUp, false)
    }
    return
  }

  if (!followUpResponse.body) {
    return
  }

  const followUpReader = followUpResponse.body.getReader()
  const followUpDecoder = new TextDecoder()

  while (true) {
    const { done, value } = await followUpReader.read()
    if (done) break

    const chunk = followUpDecoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim() !== '')

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      const data = line.slice(6).trim()
      if (data === '[DONE]') continue

      const parsedFollowUpChunk = parseChatCompletionPayload(data)
      if (!parsedFollowUpChunk) continue

      if (parsedFollowUpChunk.errorMessage) {
        console.error('Follow-up streaming chunk returned an error:', parsedFollowUpChunk.errorMessage)
        continue
      }

      applyFollowUpCompletion(parsedFollowUpChunk, true)
    }
  }
}

export async function runChatToolLoop({
  abortControllerRef,
  activeTools,
  assistantMessageId,
  callbacks,
  chatMessages,
  endpoint,
  executeTools,
  initialToolCalls,
  latestThinkingProcess: initialLatestThinkingProcess,
  mergeToolCallsIntoState,
  model,
  syncAssistantToolCalls,
  toolCallsMap,
}: RunChatToolLoopArgs) {
  const MAX_TOOL_ITERATIONS = 30
  let iteration = 0
  let latestThinkingProcess = initialLatestThinkingProcess
  let allToolCalls = [...initialToolCalls]
  let allToolResults: ToolResult[] = []
  let finalContent = ''
  let currentMessages: OutboundChatMessage[] = [...chatMessages]

  while (iteration < MAX_TOOL_ITERATIONS) {
    iteration++
    console.log(`Tool iteration ${iteration}/${MAX_TOOL_ITERATIONS}`)

    const currentToolCalls = iteration === 1
      ? allToolCalls
      : Array.from(toolCallsMap.values())

    if (currentToolCalls.length === 0) break

    currentToolCalls.forEach(tc => {
      tc.status = 'running'
    })

    const uiToolCalls = [...allToolCalls]
    if (iteration > 1) {
      currentToolCalls.forEach((tc) => {
        if (!uiToolCalls.find(t => t.id === tc.id)) {
          uiToolCalls.push(tc)
        }
      })
      allToolCalls = uiToolCalls
    }

    updateAssistantMessage(callbacks, assistantMessageId, (message) => ({
      ...message,
      toolCalls: [...uiToolCalls],
    }))

    const toolResults = await executeTools(currentToolCalls, {
      signal: abortControllerRef.current?.signal,
    })

    toolResults.forEach((result) => {
      const tc = currentToolCalls.find(t => t.id === result.callId)
      if (tc) {
        tc.status = result.error ? 'failed' : 'completed'
      }
    })

    allToolResults = [...allToolResults, ...toolResults]

    updateAssistantMessage(callbacks, assistantMessageId, (message) => ({
      ...message,
      toolCalls: [...uiToolCalls],
      toolResults: allToolResults,
    }))

    if (uiToolCalls.length > 0) {
      callbacks.setExpandedToolCards(prev => {
        if (prev.size === 0) return new Set([uiToolCalls[0].id])
        return prev
      })
    }

    currentMessages = [
      ...currentMessages,
      ...buildToolMessages(toolResults, currentToolCalls),
    ]

    const followUpResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: currentMessages,
        stream: true,
        tools: activeTools,
        tool_choice: 'auto',
      }),
      signal: abortControllerRef.current?.signal,
    })

    if (!followUpResponse.ok) {
      console.error('Follow-up API call failed:', followUpResponse.status, followUpResponse.statusText)
      break
    }

    let followUpContent = ''
    let followUpThinking = ''
    let hasMoreToolCalls = false
    let streamFinishReason = ''

    toolCallsMap.clear()

    const syncFollowUpMessage = (streaming: boolean) => {
      if (followUpThinking) {
        latestThinkingProcess = followUpThinking
      }

      if (!followUpContent && !followUpThinking) return

      updateAssistantMessage(callbacks, assistantMessageId, (message) => ({
        ...message,
        content: followUpContent || message.content,
        thinkingProcess: followUpThinking || message.thinkingProcess,
        isStreaming: streaming,
      }))
    }

    const applyFollowUpCompletion = (
      parsedCompletion: ParsedChatCompletion,
      streaming: boolean,
    ) => {
      const firstChoice = parsedCompletion.choices[0]
      const resolvedFinishReason = firstChoice?.finishReason

      if (resolvedFinishReason) {
        streamFinishReason = resolvedFinishReason
        console.log(`Iteration ${iteration} finish_reason: ${resolvedFinishReason}, hasContent: ${followUpContent.length > 0}`)
      }

      let shouldSyncToolCalls = false
      for (const parsedChoice of parsedCompletion.choices) {
        if (parsedChoice.toolCalls.length > 0) {
          hasMoreToolCalls = true
          if (mergeToolCallsIntoState(parsedChoice.toolCalls, `tool-${iteration}`, 'pending')) {
            shouldSyncToolCalls = true
          }
        }

        if (parsedChoice.content) {
          followUpContent += parsedChoice.content
        }

        if (parsedChoice.reasoningContent) {
          followUpThinking += parsedChoice.reasoningContent
        }
      }

      if (!streamFinishReason) {
        streamFinishReason = hasMoreToolCalls ? 'tool_calls' : 'stop'
      }

      if (shouldSyncToolCalls) {
        syncAssistantToolCalls()
      }

      syncFollowUpMessage(streaming)
    }

    await consumeFollowUpResponse(followUpResponse, applyFollowUpCompletion)

    if (followUpContent) {
      finalContent = followUpContent
      console.log(`Iteration ${iteration} content: ${followUpContent.substring(0, 100)}`)
    }

    if (streamFinishReason === 'tool_calls' && toolCallsMap.size > 0) {
      console.log(`Model requested ${toolCallsMap.size} more tool call(s) (finish_reason: tool_calls), will continue loop`)
      continue
    }
    if (streamFinishReason === 'stop' || streamFinishReason === 'length') {
      console.log(`Model finished (finish_reason: ${streamFinishReason}), exiting tool loop`)
      break
    }
    if (!hasMoreToolCalls) {
      console.log('No more tool calls detected, exiting tool loop')
      break
    }

    console.log(`Default case: hasMoreToolCalls=${hasMoreToolCalls}, finish_reason=${streamFinishReason}, continuing`)
  }

  if (iteration >= MAX_TOOL_ITERATIONS) {
    console.warn('Reached maximum tool iterations, stopping')
  }

  console.log('Tool loop finished, final content length:', finalContent.length)
  updateAssistantMessage(callbacks, assistantMessageId, (message) => ({
    ...message,
    content: finalContent || buildFallbackContent(allToolResults),
  }))

  return latestThinkingProcess
}
