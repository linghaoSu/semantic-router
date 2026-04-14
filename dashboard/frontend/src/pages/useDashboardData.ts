import { useCallback, useEffect, useRef, useState } from 'react'
import type { SystemStatus } from '../utils/routerRuntime'
import type { RouterConfig } from './dashboardPageSupport'

export interface DashboardData {
  config: RouterConfig | null
  status: SystemStatus | null
  loading: boolean
  refreshing: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function useDashboardData(): DashboardData {
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
    const onConfigDeployed = () => fetchAll()
    window.addEventListener('config-deployed', onConfigDeployed)
    return () => {
      clearInterval(statusInterval)
      clearInterval(configInterval)
      window.removeEventListener('config-deployed', onConfigDeployed)
    }
  }, [fetchAll, fetchStatus])

  const refresh = useCallback(() => fetchAll(true), [fetchAll])

  return { config, status, loading, refreshing, error, lastUpdated, refresh }
}
