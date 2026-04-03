import { useCallback, useRef, useState } from 'react'
import {
  addChildAtPath,
  decodeDrag,
  DRAG_MIME,
  getNodeAtPath,
  insertAtPath,
  isLeaf,
  isOperator,
  makeDragNode,
  removeAtPath,
  replaceAtPath,
  type DragData,
  type NodePath,
  type RuleNode,
} from './ExpressionBuilderSupport'

export function useExpressionTreeMutations(
  tree: RuleNode | null,
  setTree: React.Dispatch<React.SetStateAction<RuleNode | null>>,
  pushHistory: (prev: RuleNode | null) => void,
) {
  const [selectedPath, setSelectedPath] = useState<NodePath | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: NodePath } | null>(null)
  const [editingNode, setEditingNode] = useState<{ path: NodePath; signalType: string; signalName: string } | null>(null)
  const [addingToPath, setAddingToPath] = useState<NodePath | null>(null)
  const [insertSiblingTarget, setInsertSiblingTarget] = useState<{ parentPath: NodePath; index: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const handleClear = useCallback(() => {
    pushHistory(tree)
    setTree(null)
    setSelectedPath(null)
    showToast('Expression cleared')
  }, [tree, pushHistory, setTree, showToast])

  const handleDeleteNode = useCallback((path: NodePath) => {
    if (!tree) return
    const node = getNodeAtPath(tree, path)
    const label = node ? (isLeaf(node) ? `${node.signalType}("${node.signalName}")` : node.operator) : 'node'
    pushHistory(tree)
    setTree(prev => prev ? removeAtPath(prev, path) : null)
    setSelectedPath(null)
    showToast(`Deleted ${label}`)
  }, [tree, pushHistory, setTree, showToast])

  const handleNodeDoubleClick = useCallback((path: NodePath) => {
    if (!tree) return
    const node = getNodeAtPath(tree, path)
    if (!node) return
    if (isLeaf(node)) {
      setEditingNode({ path, signalType: node.signalType, signalName: node.signalName })
    }
  }, [tree])

  const handleEditSave = useCallback((signalType: string, signalName: string) => {
    if (!editingNode || !tree) { setEditingNode(null); return }
    pushHistory(tree)
    setTree(replaceAtPath(tree, editingNode.path, { signalType, signalName }))
    setEditingNode(null)
    showToast(`Updated to ${signalType}("${signalName}")`)
  }, [editingNode, tree, pushHistory, setTree, showToast])

  const handleDropOnNode = useCallback((targetPath: NodePath, dragData: DragData) => {
    if (!tree) return
    const targetNode = getNodeAtPath(tree, targetPath)
    if (!targetNode) return
    if (isLeaf(targetNode)) return
    const newNode = makeDragNode(dragData)
    if (!newNode) return
    pushHistory(tree)
    setTree(prev => prev ? addChildAtPath(prev, targetPath, newNode) : newNode)
    showToast('Added to operator node')
  }, [tree, pushHistory, setTree, showToast])

  const handleAddChild = useCallback((targetPath: NodePath) => {
    setAddingToPath(targetPath)
  }, [])

  const handleAddChildPick = useCallback((newNode: RuleNode) => {
    if (!addingToPath || !tree) { setAddingToPath(null); return }
    pushHistory(tree)
    setTree(prev => prev ? addChildAtPath(prev, addingToPath, newNode) : newNode)
    const label = isLeaf(newNode) ? `${newNode.signalType}("${newNode.signalName}")` : (newNode as Exclude<RuleNode, {signalType: string}>).operator
    showToast(`Added ${label}`)
    setAddingToPath(null)
  }, [addingToPath, tree, pushHistory, setTree, showToast])

  const handleInsertSiblingPick = useCallback((newNode: RuleNode) => {
    if (!insertSiblingTarget || !tree) { setInsertSiblingTarget(null); return }
    pushHistory(tree)
    setTree(insertAtPath(tree, insertSiblingTarget.parentPath, insertSiblingTarget.index, newNode))
    const label = isLeaf(newNode) ? `${newNode.signalType}("${newNode.signalName}")` : (newNode as Exclude<RuleNode, {signalType: string}>).operator
    showToast(`Inserted ${label}`)
    setInsertSiblingTarget(null)
  }, [insertSiblingTarget, tree, pushHistory, setTree, showToast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData(DRAG_MIME)
    if (!raw) return
    const data = decodeDrag(raw)
    if (!data || data.kind === 'tree-node') return

    const newNode = makeDragNode(data)
    if (!newNode) return

    if (!tree) {
      pushHistory(tree)
      setTree(newNode)
      showToast('Created root node')
      return
    }

    if (data.kind === 'operator') {
      pushHistory(tree)
      if (data.operator === 'NOT') {
        setTree({ operator: 'NOT', conditions: [tree] })
      } else {
        setTree({ operator: data.operator, conditions: [tree] })
      }
      showToast(`Wrapped tree with ${data.operator}`)
      return
    }

    if (isOperator(tree) && (tree.operator === 'AND' || tree.operator === 'OR')) {
      pushHistory(tree)
      setTree({ ...tree, conditions: [...tree.conditions, newNode] })
      showToast(`Added to root ${tree.operator}`)
      return
    }

    showToast('Drop onto an operator node instead')
  }, [tree, pushHistory, setTree, showToast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleWrap = useCallback((path: NodePath, op: 'AND' | 'OR' | 'NOT') => {
    if (!tree) return
    const node = getNodeAtPath(tree, path)
    if (!node) return
    pushHistory(tree)
    const wrapped: RuleNode = op === 'NOT'
      ? { operator: 'NOT', conditions: [node] }
      : { operator: op, conditions: [node] }
    setTree(replaceAtPath(tree, path, wrapped))
    setContextMenu(null)
    showToast(`Wrapped with ${op}`)
  }, [tree, pushHistory, setTree, showToast])

  const handleUnwrap = useCallback((path: NodePath) => {
    if (!tree) return
    const node = getNodeAtPath(tree, path)
    if (!node || !isOperator(node) || node.conditions.length === 0) return
    pushHistory(tree)
    setTree(replaceAtPath(tree, path, node.conditions[0]))
    setContextMenu(null)
    showToast('Unwrapped node')
  }, [tree, pushHistory, setTree, showToast])

  const handleChangeOp = useCallback((path: NodePath, newOp: 'AND' | 'OR') => {
    if (!tree) return
    const node = getNodeAtPath(tree, path)
    if (!node || !isOperator(node)) return
    pushHistory(tree)
    setTree(replaceAtPath(tree, path, { ...node, operator: newOp, conditions: node.conditions } as RuleNode))
    setContextMenu(null)
    showToast(`Changed to ${newOp}`)
  }, [tree, pushHistory, setTree, showToast])

  return {
    selectedPath,
    setSelectedPath,
    contextMenu,
    setContextMenu,
    editingNode,
    setEditingNode,
    addingToPath,
    setAddingToPath,
    insertSiblingTarget,
    setInsertSiblingTarget,
    toast,
    showToast,
    handleClear,
    handleDeleteNode,
    handleNodeDoubleClick,
    handleEditSave,
    handleDropOnNode,
    handleAddChild,
    handleAddChildPick,
    handleInsertSiblingPick,
    handleDrop,
    handleDragOver,
    handleWrap,
    handleUnwrap,
    handleChangeOp,
  }
}
