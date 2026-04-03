import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import RouterModelInventory from '../components/RouterModelInventory'
import { useAuth } from '../contexts/AuthContext'
import { canAccessMLSetup } from '../utils/accessControl'
import {
  getLoadedModelCount,
  getRouterModelAnchor,
  getTotalKnownModelCount,
  type SystemStatus,
} from '../utils/routerRuntime'
import {
  countDecisions,
  countModels,
  countPlugins,
  countSignals,
  type RouterConfig,
} from './dashboardSupport'
import { DashboardDecisionsOverview } from './DashboardDecisionsOverview'
import { DashboardMiniFlowDiagram } from './DashboardMiniFlowDiagram'
import styles from './DashboardPage.module.css'
import { DashboardHealthCard, DashboardQuickActions, DashboardSignalBreakdown } from './DashboardSections'
import { DashboardStatsGrid } from './DashboardStatsGrid'

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [config, setConfig] = useState<RouterConfig | null>(null)
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const configTickRef = useRef(0)

  const fetchStatus = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/status')
      if (statusRes.ok) {
        setStatus(await statusRes.json())
      }
    } catch {
      // Ignore transient polling errors.
    }
  }, [])

  const fetchAll = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [cfgRes, statusRes] = await Promise.all([
        fetch('/api/router/config/all'),
        fetch('/api/status'),
      ])
      if (cfgRes.ok) {
        setConfig(await cfgRes.json())
      }
      if (statusRes.ok) {
        setStatus(await statusRes.json())
      }

      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Config changes rarely — poll every 30s; status every 10s
    const statusInterval = setInterval(fetchStatus, 10000)
    const configInterval = setInterval(() => {
      configTickRef.current += 1
      if (configTickRef.current % 3 === 0) {
        fetchAll()
      } else {
        fetchStatus()
      }
    }, 10000)
    // Immediately refresh when config is deployed from DSL Builder
    const onConfigDeployed = () => fetchAll()
    window.addEventListener('config-deployed', onConfigDeployed)
    return () => {
      clearInterval(statusInterval)
      clearInterval(configInterval)
      window.removeEventListener('config-deployed', onConfigDeployed)
    }
  }, [fetchAll, fetchStatus])

  const signalStats = useMemo(() => config ? countSignals(config) : { total: 0, byType: {} }, [config])
  const decisionCount = useMemo(() => config ? countDecisions(config) : 0, [config])
  const modelCount = useMemo(() => config ? countModels(config) : 0, [config])
  const pluginCount = useMemo(() => config ? countPlugins(config) : 0, [config])
  const currentDecisions = useMemo(() => config?.routing?.decisions ?? config?.decisions ?? [], [config])
  const showMLSetupQuickLink = canAccessMLSetup(user)

  const loadedModels = useMemo(() => getLoadedModelCount(status?.models), [status])
  const knownModels = useMemo(() => getTotalKnownModelCount(status?.models), [status])
  const previewModelLimit = 6

  if (loading && !config && !status) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Building the System Intelligence</p>
        </div>
        <div className={styles.headerActions}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.refreshBtnSpin : ''}`}
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
              <path d="M14 2v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>Failed to load data: {error}</span>
          <button onClick={() => fetchAll(true)}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <DashboardStatsGrid
        signals={signalStats}
        status={status}
        modelCount={modelCount}
        decisionCount={decisionCount}
      />


      {/* Main content: 2-column */}
      <div className={styles.mainGrid}>
        {/* Left: Flow Diagram */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Intelligence Layers</h2>
            <button className={styles.cardAction} onClick={() => navigate('/topology')}>
              View Full Layers &rsaquo;
            </button>
          </div>
          <div className={styles.flowContainer}>
            {config ? (
              <DashboardMiniFlowDiagram
                signals={signalStats}
                decisions={decisionCount}
                models={modelCount}
                plugins={pluginCount}
              />
            ) : (
              <div className={styles.emptyState}>No configuration loaded</div>
            )}
          </div>
        </div>

        {/* Right: Health + Quick Info */}
        <div className={styles.rightCol}>
          <DashboardHealthCard status={status} />
          <DashboardQuickActions showMLSetupQuickLink={showMLSetupQuickLink} />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Loaded Models</h2>
            {knownModels > 0 && (
              <span className={styles.cardSubtitle}>{loadedModels}/{knownModels} ready</span>
            )}
          </div>
          <button className={styles.cardAction} onClick={() => navigate('/status')}>
            Status &rsaquo;
          </button>
        </div>
        <RouterModelInventory
          mode="preview"
          previewLimit={previewModelLimit > 0 ? previewModelLimit : undefined}
          modelsInfo={status?.models}
          emptyMessage="Router model inventory will appear here after the router reports its active models."
          onSelectModel={(model) => navigate(`/status#${encodeURIComponent(getRouterModelAnchor(model))}`)}
        />
      </div>

      {/* Signal Breakdown + Decisions Overview — 2 column layout */}
      <div className={styles.bottomGrid}>
        <DashboardSignalBreakdown signalStats={signalStats} />

        {/* Decisions Overview Table */}
        {currentDecisions.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Decisions Overview</h2>
              <button className={styles.cardAction} onClick={() => navigate('/config/decisions')}>
                Manage &rsaquo;
              </button>
            </div>

            <DashboardDecisionsOverview currentDecisions={currentDecisions} />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
