import React, { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

import styles from './ExpressionBuilder.module.css'
import { OPERATOR_META } from './ExpressionBuilderNodeSupport'
import { DRAG_MIME, decodeDrag, type RuleNode } from './ExpressionBuilderSupport'
import type { FlowNodeData } from './ExpressionBuilderFlow'

export const OperatorNodeComponent = memo<NodeProps<FlowNodeData>>(({ data, selected }) => {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragOver(false)
      const raw = event.dataTransfer.getData(DRAG_MIME)
      if (!raw) return
      const dragData = decodeDrag(raw)
      if (dragData && data.onDropOnNode) {
        data.onDropOnNode(data.path, dragData)
      }
    },
    [data]
  )

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      data.onDoubleClick?.(data.path)
    },
    [data]
  )

  const handleAddClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      data.onAddChild?.(data.path)
    },
    [data]
  )

  const opNode = data.ruleNode as Exclude<RuleNode, { signalType: string }>
  const childCount = opNode.conditions.length
  const showAddBtn = opNode.operator !== 'NOT' || childCount === 0
  const gateMeta = OPERATOR_META[opNode.operator]

  return (
    <div className={styles.rfOperatorWrapper}>
      <div
        className={`${styles.rfGateNode} ${selected ? styles.rfGateSelected : ''} ${dragOver ? styles.rfGateDragOver : ''}`}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title={`${data.label} (${childCount} children)\nRight-click for options`}
      >
        <Handle type="target" position={Position.Top} className={styles.rfHandle} />
        <gateMeta.GateShape color={gateMeta.color} />
        <span
          className={`${styles.rfGateLabel} ${opNode.operator === 'NOT' ? styles.rfGateLabelNot : ''}`}
          style={{ color: gateMeta.color }}
        >
          {data.label}
          {childCount > 0 ? <span className={styles.rfGateBadge}>{childCount}</span> : null}
        </span>
        <Handle type="source" position={Position.Bottom} className={styles.rfHandle} />
      </div>
      {showAddBtn ? (
        <div
          className={`${styles.rfAddBtn} ${dragOver ? styles.rfAddBtnActive : ''}`}
          onClick={handleAddClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          title="Click to add child, or drag items here"
        >
          +
        </div>
      ) : null}
    </div>
  )
})
OperatorNodeComponent.displayName = 'OperatorNode'

export const SignalNodeComponent = memo<NodeProps<FlowNodeData>>(({ data, selected }) => {
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      data.onDoubleClick?.(data.path)
    },
    [data]
  )

  const node = data.ruleNode as { signalType: string; signalName: string }

  return (
    <div
      className={`${styles.rfSignalNode} ${selected ? styles.rfNodeSelected : ''}`}
      onDoubleClick={handleDoubleClick}
      title={`${node.signalType}("${node.signalName}")\nDouble-click to edit`}
    >
      <Handle type="target" position={Position.Top} className={styles.rfHandle} />
      <span className={styles.rfSignalType}>{node.signalType}</span>
      <span className={styles.rfSignalName}>{node.signalName}</span>
    </div>
  )
})
SignalNodeComponent.displayName = 'SignalNode'
