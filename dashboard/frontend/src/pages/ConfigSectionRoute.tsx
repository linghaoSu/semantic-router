import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import type { ConfigSection } from '../components/ConfigNav'
import { useConfigSection } from '../contexts/useConfigSection'
import ConfigPage from './ConfigPage'

const ConfigSectionRoute: React.FC = () => {
  const { section } = useParams<{ section: string }>()
  const { configSection, setConfigSection } = useConfigSection()

  useEffect(() => {
    if (!section) {
      if (configSection !== 'global-config') {
        setConfigSection('global-config')
      }
      return
    }

    const normalized = section.toLowerCase()
    const sectionMap: Record<string, ConfigSection> = {
      global: 'global-config',
      'global-config': 'global-config',
      'router-config': 'global-config',
      signals: 'signals',
      routes: 'decisions',
      decisions: 'decisions',
      endpoints: 'models',
      models: 'models',
      mcp: 'mcp',
    }

    const mapped = sectionMap[normalized]
    if (mapped && mapped !== configSection) {
      setConfigSection(mapped)
    }
  }, [section, configSection, setConfigSection])

  return (
    <Layout>
      <ConfigPage activeSection={configSection} />
    </Layout>
  )
}

export default ConfigSectionRoute
