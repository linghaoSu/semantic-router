/**
 * ExpressionBuilder — ReactFlow-based drag-and-drop boolean expression editor (v4).
 *
 * Built on ReactFlow + Dagre for:
 *   - Infinite canvas with smooth zoom/pan (GPU-accelerated)
 *   - Automatic tree layout via dagre
 *   - MiniMap + background grid
 *   - Drag from toolbox to canvas
 *   - Node selection, context menu, undo/redo
 *   - Full backward compatibility with v3 props interface
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ReactFlowProvider, useReactFlow, useNodesState, useEdgesState, type Node } from 'reactflow'
import 'reactflow/dist/style.css'
import styles from './ExpressionBuilder.module.css'
import {
  boolExprToRuleNode,
  parseExprText,
  serializeNode,
  validateTree,
  type RuleNode,
  type SignalDescriptor,
} from './ExpressionBuilderSupport'
import { applyDagreLayout, treeToFlowElements, type FlowNodeData } from './ExpressionBuilderFlow'
import { type BuilderTemplate } from './ExpressionBuilderNodeSupport'
import ExpressionBuilderShell from './ExpressionBuilderShell'
import { useExpressionTreeMutations } from './useExpressionTreeMutations'

// ═══════════════════════════════════════════════════════════════
// Inner component (needs ReactFlowProvider context)
// ═══════════════════════════════════════════════════════════════

interface InnerProps {
  tree: RuleNode | null
  setTree: React.Dispatch<React.SetStateAction<RuleNode | null>>
  rawText: string
  setRawText: React.Dispatch<React.SetStateAction<string>>
  isRawMode: boolean
  setIsRawMode: React.Dispatch<React.SetStateAction<boolean>>
  maximized: boolean
  setMaximized: React.Dispatch<React.SetStateAction<boolean>>
  availableSignals: SignalDescriptor[]
  onChange: (expr: string) => void
  pushHistory: (prev: RuleNode | null) => void
  canUndo: boolean
  canRedo: boolean
  handleUndo: () => void
  handleRedo: () => void
  internalChangeRef: React.MutableRefObject<boolean>
}

const ExpressionBuilderInner: React.FC<InnerProps> = ({
  tree, setTree, rawText, setRawText, isRawMode, setIsRawMode,
  maximized, setMaximized, availableSignals, onChange, pushHistory,
  canUndo, canRedo, handleUndo, handleRedo,
  internalChangeRef,
}) => {
  const { fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [signalSearch, setSignalSearch] = useState('')
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const keys = new Set<string>()
    for (const s of availableSignals) keys.add(s.signalType.toUpperCase())
    return keys
  })

  const suppressSyncRef = useRef(false)

  const mutations = useExpressionTreeMutations(tree, setTree, pushHistory)

  // Sync tree → text → parent
  useEffect(() => {
    if (suppressSyncRef.current) { suppressSyncRef.current = false; return }
    const text = tree ? serializeNode(tree) : ''
    setRawText(text)
    internalChangeRef.current = true
    onChange(text)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree])

  // Close context menu on outside click
  useEffect(() => {
    if (!mutations.contextMenu) return
    const handler = () => mutations.setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [mutations.contextMenu, mutations])

  // ESC + Ctrl+Z/Y (only when not in an input element)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && maximized) setMaximized(false)
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable
      if (inInput) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [maximized, setMaximized, handleUndo, handleRedo])

  // Signal grouping
  const signalGroups = useMemo(() => {
    const groups: Record<string, SignalDescriptor[]> = {}
    for (const s of availableSignals) {
      const key = s.signalType.toUpperCase()
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [availableSignals])

  const filteredGroups = useMemo(() => {
    if (!signalSearch.trim()) return signalGroups
    const q = signalSearch.toLowerCase()
    return signalGroups
      .map(([type, signals]) => [type, signals.filter(s => s.name.toLowerCase().includes(q) || s.signalType.toLowerCase().includes(q))] as [string, SignalDescriptor[]])
      .filter(([, signals]) => signals.length > 0)
  }, [signalGroups, signalSearch])

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(group)) n.delete(group); else n.add(group); return n })
  }, [])

  // Sync tree → ReactFlow nodes/edges
  useEffect(() => {
    if (!tree) {
      setNodes([])
      setEdges([])
      return
    }
    const { nodes: rawNodes, edges: newEdges } = treeToFlowElements(tree, mutations.handleNodeDoubleClick, mutations.handleDropOnNode, mutations.handleAddChild)
    const layoutNodes = applyDagreLayout(rawNodes, newEdges)
    setNodes(layoutNodes)
    setEdges(newEdges)
    setTimeout(() => fitView({ padding: 0.15, duration: 200 }), 50)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, mutations.handleNodeDoubleClick, mutations.handleDropOnNode, mutations.handleAddChild])

  // ── Node click → select + context menu ──
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    mutations.setSelectedPath(node.data.path)
  }, [mutations])

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node<FlowNodeData>) => {
    e.preventDefault()
    e.stopPropagation()
    mutations.setContextMenu({ x: e.clientX, y: e.clientY, path: node.data.path })
  }, [mutations])

  const onPaneClick = useCallback(() => {
    mutations.setSelectedPath(null)
    mutations.setContextMenu(null)
  }, [mutations])

  // ── Node delete via backspace/delete (only when canvas is focused, not in inputs) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't interfere with inputs, textareas, selects, or contenteditable
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && mutations.selectedPath && mutations.selectedPath.length > 0) {
        e.preventDefault()
        mutations.handleDeleteNode(mutations.selectedPath)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mutations])

  // Raw text editing
  const handleRawChange = useCallback((text: string) => {
    setRawText(text)
    suppressSyncRef.current = true
    setTree(parseExprText(text))
    onChange(text)
  }, [onChange, setRawText, setTree])

  const validationIssues = useMemo(() => validateTree(tree, availableSignals), [tree, availableSignals])

  const applyTemplate = useCallback((tpl: BuilderTemplate) => {
    pushHistory(tree)
    setTree(tpl.build())
  }, [tree, pushHistory, setTree])

  return (
    <ExpressionBuilderShell
      applyTemplate={applyTemplate}
      availableSignals={availableSignals}
      canRedo={canRedo}
      canUndo={canUndo}
      collapsedGroups={collapsedGroups}
      edges={edges}
      filteredGroups={filteredGroups}
      handleRawChange={handleRawChange}
      handleRedo={handleRedo}
      handleUndo={handleUndo}
      isRawMode={isRawMode}
      maximized={maximized}
      mutations={mutations}
      nodes={nodes}
      onEdgesChange={onEdgesChange}
      onFitView={() => fitView({ padding: 0.15, duration: 200 })}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      onNodesChange={onNodesChange}
      onPaneClick={onPaneClick}
      rawText={rawText}
      setIsRawMode={setIsRawMode}
      setMaximized={setMaximized}
      setSignalSearch={setSignalSearch}
      setToolboxCollapsed={setToolboxCollapsed}
      signalSearch={signalSearch}
      toolboxCollapsed={toolboxCollapsed}
      toggleGroup={toggleGroup}
      tree={tree}
      validationIssues={validationIssues}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// Outer Component (provides ReactFlowProvider)
// ═══════════════════════════════════════════════════════════════

interface ExpressionBuilderProps {
  value: string
  onChange: (expr: string) => void
  initialAstExpr?: Record<string, unknown> | null
  availableSignals: SignalDescriptor[]
}

const ExpressionBuilder: React.FC<ExpressionBuilderProps> = ({
  value, onChange, initialAstExpr, availableSignals,
}) => {
  const [tree, setTree] = useState<RuleNode | null>(() => {
    if (initialAstExpr) { const n = boolExprToRuleNode(initialAstExpr); if (n) return n }
    return parseExprText(value)
  })

  const [rawText, setRawText] = useState(value)
  const [isRawMode, setIsRawMode] = useState(false)
  const [maximized, setMaximized] = useState(false)

  // Undo / Redo history
  const [history, setHistory] = useState<(RuleNode | null)[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const skipHistoryRef = useRef(false)

  const pushHistory = useCallback((prev: RuleNode | null) => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return }
    setHistory(h => {
      const trimmed = h.slice(0, historyIdx + 1)
      return [...trimmed, prev].slice(-50)
    })
    setHistoryIdx(i => Math.min(i + 1, 49))
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
  }, [canUndo, history, historyIdx, tree])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    skipHistoryRef.current = true
    setTree(history[historyIdx + 1])
    setHistoryIdx(i => i + 1)
  }, [canRedo, history, historyIdx])

  // Sync external value changes
  const prevValueRef = useRef(value)
  const internalChangeRef = useRef(false)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      if (internalChangeRef.current) {
        internalChangeRef.current = false
        return
      }
      if (initialAstExpr) {
        const n = boolExprToRuleNode(initialAstExpr)
        if (n) { setTree(n); setRawText(value); return }
      }
      // Only re-parse into tree if the text actually parses successfully.
      // Incomplete expressions (e.g. containing '?') should not destroy the current tree.
      const parsed = parseExprText(value)
      if (parsed) {
        setTree(parsed)
      }
      setRawText(value)
    }
  }, [value, initialAstExpr])

  const innerProps: InnerProps = {
    tree, setTree, rawText, setRawText, isRawMode, setIsRawMode,
    maximized, setMaximized, availableSignals, onChange, pushHistory,
    canUndo, canRedo, handleUndo, handleRedo,
    internalChangeRef,
  }

  const content = (
    <ReactFlowProvider>
      <ExpressionBuilderInner {...innerProps} />
    </ReactFlowProvider>
  )

  if (maximized) {
    return createPortal(
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenContainer}>
          <div className={styles.fullscreenHeader}>
            <span className={styles.fullscreenTitle}>Expression Builder</span>
            <button className={styles.fullscreenCloseBtn} onClick={() => setMaximized(false)} title="Exit fullscreen (Esc)">✕</button>
          </div>
          {content}
        </div>
      </div>,
      document.body
    )
  }

  return content
}

export default ExpressionBuilder
