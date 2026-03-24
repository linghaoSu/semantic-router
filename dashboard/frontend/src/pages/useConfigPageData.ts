import { useState, useEffect, useMemo } from 'react'
import { useReadonly } from '../contexts/ReadonlyContext'
import {
  canonicalizeConfigForManagerSave,
  projectCanonicalConfigForManager,
} from './configPageCanonicalization'
import { ConfigFormat, detectConfigFormat } from '../types/config'
import {
  CanonicalGlobalConfig,
  ConfigData,
  Tool,
  getDefaultModelName,
  getNormalizedModels,
  getReasoningFamiliesMap,
} from './configPageSupport'

export function useConfigPageData() {
  const { isReadonly } = useReadonly()
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [configFormat, setConfigFormat] = useState<ConfigFormat>('python-cli')

  // Effective global runtime config resolved from router defaults + config.yaml overrides
  const [routerDefaults, setRouterDefaults] = useState<CanonicalGlobalConfig | null>(null)

  // Tools database state
  const [toolsData, setToolsData] = useState<Tool[]>([])
  const [toolsLoading, setToolsLoading] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)

  const fetchConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/router/config/all')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      const normalized = projectCanonicalConfigForManager(data)
      setConfig(normalized)
      const format = detectConfigFormat(normalized)
      setConfigFormat(format)
      if (format === 'legacy') {
        console.warn('Legacy config format detected. Consider migrating to Python CLI format.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch config')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchRouterDefaults = async () => {
    try {
      const response = await fetch('/api/router/config/global')
      if (!response.ok) {
        console.warn('Global runtime config not available:', response.statusText)
        setRouterDefaults(null)
        return
      }
      const data = await response.json()
      setRouterDefaults(data)
    } catch (err) {
      console.warn('Failed to fetch global runtime config:', err)
      setRouterDefaults(null)
    }
  }

  const fetchToolsDB = async () => {
    setToolsLoading(true)
    setToolsError(null)
    try {
      const response = await fetch('/api/tools-db')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setToolsData(data)
    } catch (err) {
      setToolsError(err instanceof Error ? err.message : 'Failed to fetch tools database')
      setToolsData([])
    } finally {
      setToolsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchRouterDefaults()
  }, [])

  useEffect(() => {
    const toolsDBPath =
      routerDefaults?.integrations?.tools?.tools_db_path ||
      config?.global?.integrations?.tools?.tools_db_path ||
      config?.tools?.tools_db_path

    if (toolsDBPath) {
      fetchToolsDB()
    }
  }, [
    config?.global?.integrations?.tools?.tools_db_path,
    config?.tools?.tools_db_path,
    routerDefaults?.integrations?.tools?.tools_db_path,
  ])

  const saveConfig = async (updatedConfig: ConfigData) => {
    if (isReadonly) {
      throw new Error('Dashboard is in read-only mode. Configuration editing is disabled.')
    }

    try {
      const canonicalConfig = canonicalizeConfigForManagerSave(updatedConfig as ConfigData)
      const response = await fetch('/api/router/config/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(canonicalConfig),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.error || errorJson.message) {
              errorMessage = errorJson.error || errorJson.message
            } else {
              errorMessage = errorText
            }
          } catch {
            errorMessage = errorText
          }
        }
        throw new Error(errorMessage)
      }

      await fetchConfig()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save configuration')
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS - Normalize data access across config formats
  // ============================================================================

  // Helper: Check if using Python CLI format
  const isPythonCLI = configFormat === 'python-cli'
  const models = useMemo(() => getNormalizedModels(config, isPythonCLI), [config, isPythonCLI])
  const defaultModel = getDefaultModelName(config, isPythonCLI)
  const reasoningFamilies = getReasoningFamiliesMap(config, isPythonCLI)

  return {
    config,
    loading,
    error,
    isPythonCLI,
    models,
    defaultModel,
    reasoningFamilies,
    toolsData,
    toolsLoading,
    toolsError,
    saveConfig,
    refreshConfig: fetchConfig,
  }
}
