import React, { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import styles from './Layout.module.css'
import LayoutAccountControl from './LayoutAccountControl'
import LayoutNavigation from './LayoutNavigation'
import {
  ANALYSIS_OPERATIONS_MENU_SECTIONS,
  FLEET_SIM_MENU_SECTIONS,
  filterLayoutMenuSections,
  hasActiveLayoutMenuSection,
  MANAGER_MENU_SECTIONS,
  SECONDARY_NAV_LINKS,
  type LayoutDropdownKey,
  type LayoutMenuItem,
} from './LayoutNavSupport'
import { useAuth } from '../contexts/AuthContext'
import { useConfigSection } from '../contexts/useConfigSection'
import { useReadonly } from '../contexts/ReadonlyContext'
import { canAccessMLSetup } from '../utils/accessControl'
import type { ConfigSection } from './ConfigNav'

interface LayoutProps {
  children: ReactNode
  hideHeaderOnMobile?: boolean
  hideAccountControl?: boolean
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeaderOnMobile,
  hideAccountControl = false,
}) => {
  const { configSection, setConfigSection } = useConfigSection()
  const onConfigSectionChange = (section: string) => setConfigSection(section as ConfigSection)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<LayoutDropdownKey | null>(null)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const { user, logout } = useAuth()
  const { fleetSimEnabled } = useReadonly()
  const location = useLocation()
  const navigate = useNavigate()
  const canManageUsers = user?.role === 'admin'
  const canUseMLSetup = canAccessMLSetup(user)
  const secondaryNavLinks = SECONDARY_NAV_LINKS.filter((link) => link.to !== '/users' || canManageUsers)
  const managerMenuSections = filterLayoutMenuSections(
    MANAGER_MENU_SECTIONS,
    item => canManageUsers || item.kind !== 'route' || item.to !== '/users'
  )
  const analysisOperationsMenuSections = filterLayoutMenuSections(
    ANALYSIS_OPERATIONS_MENU_SECTIONS,
    item => canUseMLSetup || item.kind !== 'route' || item.to !== '/ml-setup'
  )
  const accountName = user?.name?.trim() || 'Account'
  const accountEmail = user?.email?.trim() || 'Session pending'
  const accountPermissions = user?.permissions ?? []

  const isConfigPage = location.pathname === '/config' || location.pathname.startsWith('/config/')
  const isManagerActive = hasActiveLayoutMenuSection(
    managerMenuSections,
    location.pathname,
    isConfigPage,
    configSection
  )
  const isAnalysisOpsActive = hasActiveLayoutMenuSection(
    analysisOperationsMenuSections,
    location.pathname,
    isConfigPage,
    configSection
  )
  const isFleetSimActive = fleetSimEnabled
    ? hasActiveLayoutMenuSection(
        FLEET_SIM_MENU_SECTIONS,
        location.pathname,
        isConfigPage,
        configSection
      )
    : false

  const closeMenus = () => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
    setIsAccountDialogOpen(false)
  }

  const toggleDropdown = (dropdown: LayoutDropdownKey) => {
    setIsAccountDialogOpen(false)
    setOpenDropdown(prev => (prev === dropdown ? null : dropdown))
  }

  const toggleAccountDialog = () => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
    setIsAccountDialogOpen(prev => !prev)
  }

  const handleMenuItemSelect = (item: LayoutMenuItem) => {
    if (item.kind === 'config') {
      onConfigSectionChange?.(item.configSection)
      navigate(`/config/${item.configSection}`)
    } else {
      navigate(item.to)
    }
    closeMenus()
  }

  const handleLogout = () => {
    logout()
    closeMenus()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.navDropdown}`)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={`${styles.container} ${hideHeaderOnMobile ? styles.hideHeaderMobile : ''}`}>
      <header className={`${styles.header} ${hideHeaderOnMobile ? styles.headerHideMobile : ''}`}>
        <div className={styles.headerContent}>
          <NavLink to="/" className={styles.brand}>
            <img src="/vllm.png" alt="vLLM" className={styles.logo} />
            <span className={styles.brandText}></span>
          </NavLink>

          <LayoutNavigation
            analysisOperationsMenuSections={analysisOperationsMenuSections}
            closeMenus={closeMenus}
            configSection={configSection}
            fleetSimEnabled={fleetSimEnabled}
            isAnalysisOpsActive={isAnalysisOpsActive}
            isConfigPage={isConfigPage}
            isFleetSimActive={isFleetSimActive}
            isManagerActive={isManagerActive}
            locationPathname={location.pathname}
            managerMenuSections={managerMenuSections}
            mobileMenuOpen={mobileMenuOpen}
            onMenuItemSelect={handleMenuItemSelect}
            openDropdown={openDropdown}
            secondaryNavLinks={secondaryNavLinks}
            toggleDropdown={toggleDropdown}
          />

          <div className={styles.headerRight}>
            {hideAccountControl ? null : (
              <LayoutAccountControl
                accountName={accountName}
                accountEmail={accountEmail}
                accountRole={user?.role}
                accountPermissions={accountPermissions}
                isOpen={isAccountDialogOpen}
                onToggle={toggleAccountDialog}
                onClose={closeMenus}
                onLogout={handleLogout}
              />
            )}
            <a
              href="https://github.com/vllm-project/semantic-router"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconButton}
              aria-label="GitHub"
              title="GitHub Repository"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://vllm-semantic-router.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconButton}
              aria-label="Documentation"
              title="Documentation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </a>

            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M6 6L18 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainContent}>{children}</div>
      </main>
    </div>
  )
}

export default Layout
