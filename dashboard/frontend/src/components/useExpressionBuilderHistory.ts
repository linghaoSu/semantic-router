import { useCallback, useRef, useState } from 'react'
import type { RuleNode } from './ExpressionBuilderSupport'

const HISTORY_LIMIT = 50

export interface ExpressionBuilderHistory {
  pushHistory: (prev: RuleNode | null) => void
  canUndo: boolean
  canRedo: boolean
  handleUndo: () => void
  handleRedo: () => void
  skipHistoryRef: React.MutableRefObject<boolean>
}

export function useExpressionBuilderHistory(
  tree: RuleNode | null,
  setTree: React.Dispatch<React.SetStateAction<RuleNode | null>>
): ExpressionBuilderHistory {
  const [history, setHistory] = useState<(RuleNode | null)[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const skipHistoryRef = useRef(false)

  const pushHistory = useCallback((prev: RuleNode | null) => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return }
    setHistory(h => {
      const trimmed = h.slice(0, historyIdx + 1)
      return [...trimmed, prev].slice(-HISTORY_LIMIT)
    })
    setHistoryIdx(i => Math.min(i + 1, HISTORY_LIMIT - 1))
  }, [historyIdx])

  const canUndo = historyIdx >= 0
  const canRedo = historyIdx < history.length - 1

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    skipHistoryRef.current = true
    setHistory(h => {
      const trimmed = h.slice(0, historyIdx + 1)
      return [...trimmed, tree]
    })
    setTree(history[historyIdx])
    setHistoryIdx(i => i - 1)
  }, [canUndo, history, historyIdx, tree, setTree])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    skipHistoryRef.current = true
    setTree(history[historyIdx + 1])
    setHistoryIdx(i => i + 1)
  }, [canRedo, history, historyIdx, setTree])

  return { pushHistory, canUndo, canRedo, handleUndo, handleRedo, skipHistoryRef }
}
