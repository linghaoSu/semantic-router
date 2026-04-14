import React from 'react'
import styles from './DashboardPage.module.css'

export interface SignalConfig {
  name?: string
  type?: string
  [key: string]: unknown
}

export interface DecisionRule {
  name?: string
  description?: string
  priority?: number
  rules?: unknown[]
  modelRefs?: unknown[]
  plugins?: unknown[]
  [key: string]: unknown
}

export interface RouterConfig {
  signals?: Record<string, SignalConfig[]>
  decisions?: DecisionRule[]
  providers?: {
    defaults?: {
      default_model?: string
    }
    models?: Array<{
      name?: string
      backend_refs?: Array<{ name?: string }>
      endpoints?: Array<{ name?: string }>
      preferred_endpoints?: string[]
      [key: string]: unknown
    }>
    vllm_endpoints?: unknown[]
    [key: string]: unknown
  }
  routing?: {
    signals?: Record<string, SignalConfig[]>
    decisions?: DecisionRule[]
  }
  vllm_endpoints?: Array<{ name?: string }>
  plugins?: Record<string, unknown>
  global?: Record<string, unknown>
  [key: string]: unknown
}

export const SIGNAL_COLORS: Record<string, string> = {
  keywords: '#4EC9B0',
  embeddings: '#9CDCFE',
  domains: '#DCDCAA',
  fact_check: '#CE9178',
  user_feedbacks: '#C586C0',
  reasks: '#FFB454',
  preferences: '#4FC1FF',
  language: '#B5CEA8',
  context: '#D7BA7D',
  complexity: '#569CD6',
  modality: '#D4D4D4',
  authz: '#F48771',
  jailbreak: '#F48771',
  pii: '#FF6B6B',
}

export function countSignals(cfg: RouterConfig): { total: number; byType: Record<string, number> } {
  const byType: Record<string, number> = {}
  let total = 0
  const signals = cfg.routing?.signals ?? cfg.signals
  if (signals) {
    for (const [type, arr] of Object.entries(signals)) {
      if (Array.isArray(arr)) {
        byType[type] = arr.length
        total += arr.length
      }
    }
  }
  return { total, byType }
}

export function countDecisions(cfg: RouterConfig): number {
  const decisions = cfg.routing?.decisions ?? cfg.decisions
  return Array.isArray(decisions) ? decisions.length : 0
}

export function countModels(cfg: RouterConfig): number {
  const models = cfg.providers?.models
  if (Array.isArray(models)) {
    return models.length
  }

  const legacyRootEndpoints = cfg.vllm_endpoints
  if (Array.isArray(legacyRootEndpoints)) return legacyRootEndpoints.length

  const legacyProviderEndpoints = cfg.providers?.vllm_endpoints
  return Array.isArray(legacyProviderEndpoints) ? legacyProviderEndpoints.length : 0
}

export function countPlugins(cfg: RouterConfig): number {
  const decisions = cfg.routing?.decisions ?? cfg.decisions
  if (Array.isArray(decisions)) {
    return decisions.reduce((count, decision) => count + (Array.isArray(decision.plugins) ? decision.plugins.length : 0), 0)
  }
  if (!cfg.plugins || typeof cfg.plugins !== 'object') return 0
  return Object.keys(cfg.plugins).length
}

export function getDecisionCategory(priority?: number): 'guardrail' | 'routing' | 'fallback' {
  if (priority == null) return 'routing'
  if (priority >= 999) return 'guardrail'
  if (priority <= 100) return 'fallback'
  return 'routing'
}

interface FlowProps {
  signals: { total: number; byType: Record<string, number> }
  decisions: number
  models: number
  plugins: number
}

export const MiniFlowDiagram: React.FC<FlowProps> = React.memo(({ signals, decisions, models, plugins }) => {
  const signalTypes = Object.entries(signals.byType).sort((a, b) => b[1] - a[1])
  const visibleSignals = signalTypes.slice(0, 7)
  const hiddenCount = signalTypes.length - visibleSignals.length
  const rowH = 34
  const sH = Math.max(visibleSignals.length * rowH + (hiddenCount > 0 ? 28 : 0) + 30, 180)
  const height = Math.max(sH, 220)

  const colSignal = 90
  const colDecision = 310
  const colModel = 530
  const midY = height / 2

  return (
    <svg
      viewBox={`0 0 620 ${height}`}
      className={styles.flowSvg}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" />
        </marker>
      </defs>

      {visibleSignals.map(([type, count], i) => {
        const y = 16 + i * rowH
        const color = SIGNAL_COLORS[type] || '#999'
        const endY = y + 14
        const cx1 = colSignal + 52 + 40
        const cx2 = colDecision - 50 - 40
        return (
          <g key={type} className={styles.flowNode}>
            <rect x={colSignal - 55} y={y} width={110} height={26} rx={6} fill={color + '18'} stroke={color} strokeWidth={1} />
            <text x={colSignal} y={y + 17} textAnchor="middle" fill={color} fontSize={10.5} fontFamily="var(--font-mono)">
              {type} ({count})
            </text>
            <path
              d={`M ${colSignal + 55} ${endY} C ${cx1} ${endY}, ${cx2} ${midY}, ${colDecision - 52} ${midY}`}
              fill="none" stroke="var(--color-border-hover)" strokeWidth={1} opacity={0.35}
              markerEnd="url(#arrow)"
            />
          </g>
        )
      })}

      {hiddenCount > 0 && (
        <text
          x={colSignal} y={16 + visibleSignals.length * rowH + 14}
          textAnchor="middle" fill="var(--color-text-muted)" fontSize={10} fontStyle="italic"
        >
          +{hiddenCount} more
        </text>
      )}

      <rect x={colDecision - 52} y={midY - 30} width={104} height={60} rx={10}
        fill="var(--color-primary)" fillOpacity={0.12} stroke="var(--color-primary)" strokeWidth={1.5} />
      <text x={colDecision} y={midY - 6} textAnchor="middle" fill="var(--color-primary)" fontSize={11} fontWeight="bold">Decision</text>
      <text x={colDecision} y={midY + 12} textAnchor="middle" fill="var(--color-primary)" fontSize={10.5} opacity={0.85}>{decisions} layers</text>

      <line
        x1={colDecision + 54} y1={midY}
        x2={colModel - 54} y2={midY}
        stroke="var(--color-border-hover)" strokeWidth={1.5}
        markerEnd="url(#arrow)"
      />

      <rect x={colModel - 52} y={midY - 30} width={104} height={60} rx={10}
        fill="var(--color-accent-cyan)" fillOpacity={0.10} stroke="var(--color-accent-cyan)" strokeWidth={1.5} />
      <text x={colModel} y={midY - 6} textAnchor="middle" fill="var(--color-accent-cyan)" fontSize={11} fontWeight="bold">Models</text>
      <text x={colModel} y={midY + 12} textAnchor="middle" fill="var(--color-accent-cyan)" fontSize={10.5} opacity={0.85}>{models} models</text>

      {plugins > 0 && (
        <g>
          <rect x={colDecision - 30} y={midY + 40} width={60} height={22} rx={11}
            fill="var(--color-accent-purple)" fillOpacity={0.15} stroke="var(--color-accent-purple)" strokeWidth={1} />
          <text x={colDecision} y={midY + 55} textAnchor="middle" fill="var(--color-accent-purple)" fontSize={10}>{plugins} plugins</text>
        </g>
      )}

      <text x={colSignal} y={height - 4} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} letterSpacing="0.05em">SIGNALS</text>
      <text x={colDecision} y={height - 4} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} letterSpacing="0.05em">DECISIONS</text>
      <text x={colModel} y={height - 4} textAnchor="middle" fill="var(--color-text-muted)" fontSize={9} letterSpacing="0.05em">MODELS</text>
    </svg>
  )
})

MiniFlowDiagram.displayName = 'MiniFlowDiagram'
