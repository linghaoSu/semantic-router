import React from 'react'
import Layout from './Layout'
import type { ConfigSection } from './ConfigNav'
import { useConfigSection } from '../contexts/ConfigSectionContext'

interface LayoutRouteProps {
  children: React.ReactNode
  hideHeaderOnMobile?: boolean
  hideAccountControl?: boolean
}

const LayoutRoute: React.FC<LayoutRouteProps> = ({ children, hideHeaderOnMobile, hideAccountControl }) => {
  const { configSection, setConfigSection } = useConfigSection()
  return (
    <Layout
      configSection={configSection}
      onConfigSectionChange={(section) => setConfigSection(section as ConfigSection)}
      hideHeaderOnMobile={hideHeaderOnMobile}
      hideAccountControl={hideAccountControl}
    >
      {children}
    </Layout>
  )
}

export default LayoutRoute
