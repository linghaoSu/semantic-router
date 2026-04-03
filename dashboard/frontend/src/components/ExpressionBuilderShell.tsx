import type { Dispatch, MouseEvent, SetStateAction } from 'react'

import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from 'reactflow'

import styles from './ExpressionBuilder.module.css'
import ExpressionBuilderCanvasEmptyState from './ExpressionBuilderCanvasEmptyState'
import ExpressionBuilderContextMenu from './ExpressionBuilderContextMenu'
import { AddChildPicker, EditSignalDialog } from './ExpressionBuilderDialogs'
import { type FlowNodeData } from './ExpressionBuilderFlow'
import { type BuilderTemplate } from './ExpressionBuilderNodeSupport'
import { nodeTypes } from './ExpressionBuilderNodeTypes'
import {
  getNodeAtPath,
  isLeaf,
  type RuleNode,
  type SignalDescriptor,
} from './ExpressionBuilderSupport'
import ExpressionBuilderToolbox from './ExpressionBuilderToolbox'
import { useExpressionTreeMutations } from './useExpressionTreeMutations'

interface ExpressionBuilderShellProps {
  applyTemplate: (tpl: BuilderTemplate) => void
  availableSignals: SignalDescriptor[]
  canRedo: boolean
  canUndo: boolean
  collapsedGroups: Set<string>
  edges: Edge[]
  filteredGroups: Array<[string, SignalDescriptor[]]>
  handleRawChange: (text: string) => void
  handleRedo: () => void
  handleUndo: () => void
  isRawMode: boolean
  maximized: boolean
  mutations: ReturnType<typeof useExpressionTreeMutations>
  nodes: Node<FlowNodeData>[]
  onEdgesChange: OnEdgesChange
  onFitView: () => void
  onNodeClick: (_: MouseEvent, node: Node<FlowNodeData>) => void
  onNodeContextMenu: (e: MouseEvent, node: Node<FlowNodeData>) => void
  onNodesChange: OnNodesChange
  onPaneClick: () => void
  rawText: string
  setIsRawMode: Dispatch<SetStateAction<boolean>>
  setMaximized: Dispatch<SetStateAction<boolean>>
  setSignalSearch: Dispatch<SetStateAction<string>>
  setToolboxCollapsed: Dispatch<SetStateAction<boolean>>
  signalSearch: string
  toolboxCollapsed: boolean
  toggleGroup: (group: string) => void
  tree: RuleNode | null
  validationIssues: string[]
}

export default function ExpressionBuilderShell({
  applyTemplate,
  availableSignals,
  canRedo,
  canUndo,
  collapsedGroups,
  edges,
  filteredGroups,
  handleRawChange,
  handleRedo,
  handleUndo,
  isRawMode,
  maximized,
  mutations,
  nodes,
  onEdgesChange,
  onFitView,
  onNodeClick,
  onNodeContextMenu,
  onNodesChange,
  onPaneClick,
  rawText,
  setIsRawMode,
  setMaximized,
  setSignalSearch,
  setToolboxCollapsed,
  signalSearch,
  toolboxCollapsed,
  toggleGroup,
  tree,
  validationIssues,
}: ExpressionBuilderShellProps) {
  return (
    <div
      className={`${styles.container} ${maximized ? styles.containerMaximized : ''}`}
      onClick={() => {
        mutations.setSelectedPath(null)
        mutations.setContextMenu(null)
      }}
    >
      <div className={styles.mainLayout}>
        <div className={styles.canvasWrapper}>
          <div className={styles.zoomBar}>
            <div className={styles.toolbarGroup}>
              <button className={styles.zoomBtn} onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩</button>
              <button className={styles.zoomBtn} onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪</button>
            </div>
            <div className={styles.toolbarSep} />
            <div className={styles.toolbarGroup}>
              <button className={styles.zoomBtn} onClick={onFitView} title="Fit to view">Fit</button>
            </div>
            {mutations.selectedPath ? (
              <span className={styles.zoomHint}>
                Selected: {(() => {
                  const node = tree && getNodeAtPath(tree, mutations.selectedPath)
                  return node ? (isLeaf(node) ? `${node.signalType}("${node.signalName}")` : node.operator) : '—'
                })()}
              </span>
            ) : null}
            <div className={styles.toolbarSpacer} />
            <button
              className={`${styles.zoomBtn} ${styles.maximizeBtn}`}
              onClick={(e) => {
                e.stopPropagation()
                setMaximized(!maximized)
              }}
              title={maximized ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            >
              {maximized ? '⊗' : '⛶'}
            </button>
          </div>

          <div
            className={styles.rfCanvas}
            onDrop={mutations.handleDrop}
            onDragOver={mutations.handleDragOver}
          >
            {tree ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={onPaneClick}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.05}
                maxZoom={4}
                connectionLineType={ConnectionLineType.Bezier}
                defaultEdgeOptions={{
                  type: 'default',
                  style: { strokeWidth: 2 },
                }}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesFocusable={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(118, 185, 0, 0.15)" />
                <Controls showInteractive={false} position="bottom-left" className={styles.rfControls} />
                <MiniMap
                  nodeColor={(node) => node.type === 'operatorNode' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(118, 185, 0, 0.7)'}
                  maskColor="rgba(0, 0, 0, 0.15)"
                  className={styles.rfMinimap}
                  pannable
                  zoomable
                  position="bottom-right"
                  style={{ width: 120, height: 80 }}
                />
              </ReactFlow>
            ) : (
              <ExpressionBuilderCanvasEmptyState onApplyTemplate={applyTemplate} />
            )}
          </div>
        </div>

        <ExpressionBuilderToolbox
          collapsedGroups={collapsedGroups}
          filteredGroups={filteredGroups}
          signalCount={availableSignals.length}
          signalSearch={signalSearch}
          toolboxCollapsed={toolboxCollapsed}
          onClear={mutations.handleClear}
          onSignalSearchChange={setSignalSearch}
          onToggleCollapsed={() => setToolboxCollapsed(prev => !prev)}
          onToggleGroup={toggleGroup}
        />
      </div>

      <div className={styles.result}>
        <span className={styles.resultLabel}>Result:</span>
        {tree ? (
          <code className={styles.resultExpr}>{rawText}</code>
        ) : (
          <span className={styles.resultPlaceholder}>No condition — route matches all requests</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label className={styles.rawToggle}>
          <input
            type="checkbox"
            checked={isRawMode}
            onChange={e => setIsRawMode(e.target.checked)}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Edit raw expression
        </label>
      </div>
      {isRawMode ? (
        <input
          className={styles.rawInput}
          value={rawText}
          onChange={e => handleRawChange(e.target.value)}
          placeholder='e.g. domain("math") AND complexity("hard")'
          onClick={e => e.stopPropagation()}
        />
      ) : null}

      {validationIssues.length > 0 ? (
        <div>
          {validationIssues.map((warning, index) => (
            <div key={index} className={styles.validationWarn}>⚠ {warning}</div>
          ))}
        </div>
      ) : null}
      {tree && validationIssues.length === 0 ? (
        <div className={styles.validationOk}>✓ All referenced signals exist</div>
      ) : null}

      {mutations.contextMenu && tree ? (
        <ExpressionBuilderContextMenu
          contextMenu={mutations.contextMenu}
          tree={tree}
          onAddChild={(path) => {
            mutations.setAddingToPath(path)
            mutations.setContextMenu(null)
          }}
          onChangeOp={mutations.handleChangeOp}
          onDeleteNode={(path) => {
            mutations.handleDeleteNode(path)
            mutations.setContextMenu(null)
          }}
          onEditSignal={(path, signalType, signalName) => {
            mutations.setEditingNode({ path, signalType, signalName })
            mutations.setContextMenu(null)
          }}
          onInsertSibling={(target) => {
            mutations.setInsertSiblingTarget(target)
            mutations.setContextMenu(null)
          }}
          onUnwrap={mutations.handleUnwrap}
          onWrap={mutations.handleWrap}
        />
      ) : null}

      {mutations.editingNode ? (
        <EditSignalDialog
          signalType={mutations.editingNode.signalType}
          signalName={mutations.editingNode.signalName}
          availableSignals={availableSignals}
          onSave={mutations.handleEditSave}
          onCancel={() => mutations.setEditingNode(null)}
        />
      ) : null}

      {mutations.addingToPath ? (
        <AddChildPicker
          availableSignals={availableSignals}
          onPick={mutations.handleAddChildPick}
          onCancel={() => mutations.setAddingToPath(null)}
        />
      ) : null}

      {mutations.insertSiblingTarget ? (
        <AddChildPicker
          availableSignals={availableSignals}
          onPick={mutations.handleInsertSiblingPick}
          onCancel={() => mutations.setInsertSiblingTarget(null)}
        />
      ) : null}

      {mutations.toast ? <div className={styles.toast}>{mutations.toast}</div> : null}
    </div>
  )
}
