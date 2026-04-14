import React, { createContext, useContext, useMemo, useState } from 'react'
import type { ConfigSection } from '../components/ConfigNav'

interface ConfigSectionContextValue {
  configSection: ConfigSection
  setConfigSection: (section: ConfigSection) => void
}

const ConfigSectionContext = createContext<ConfigSectionContextValue | null>(null)

export const ConfigSectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configSection, setConfigSection] = useState<ConfigSection>('global-config')
  const value = useMemo(() => ({ configSection, setConfigSection }), [configSection])
  return <ConfigSectionContext.Provider value={value}>{children}</ConfigSectionContext.Provider>
}

export const useConfigSection = (): ConfigSectionContextValue => {
  const ctx = useContext(ConfigSectionContext)
  if (!ctx) {
    throw new Error('useConfigSection must be used inside ConfigSectionProvider')
  }
  return ctx
}
