import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { ConfigSection } from '../components/ConfigNav'
import ConfigPage from './ConfigPage'

const ConfigSectionRoute: React.FC<{
  configSection: ConfigSection
  setConfigSection: (section: ConfigSection) => void
}> = ({ configSection, setConfigSection }) => {
  const { section } = useParams<{ section: string }>()

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
    <Layout
      configSection={configSection}
      onConfigSectionChange={(nextSection) => setConfigSection(nextSection as ConfigSection)}
    >
      <ConfigPage activeSection={configSection} />
    </Layout>
  )
}

export default ConfigSectionRoute
