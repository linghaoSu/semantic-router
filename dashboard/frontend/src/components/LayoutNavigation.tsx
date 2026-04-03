import React from 'react'
import { NavLink } from 'react-router-dom'

import styles from './Layout.module.css'
import {
  PRIMARY_NAV_LINKS,
  FLEET_SIM_MENU_SECTIONS,
  isLayoutMenuItemActive,
  type LayoutDropdownKey,
  type LayoutMenuItem,
  type LayoutMenuSection,
  type LayoutNavLink,
} from './LayoutNavSupport'

interface LayoutNavigationProps {
  analysisOperationsMenuSections: LayoutMenuSection[]
  closeMenus: () => void
  configSection?: string
  fleetSimEnabled: boolean
  isAnalysisOpsActive: boolean
  isConfigPage: boolean
  isFleetSimActive: boolean
  isManagerActive: boolean
  locationPathname: string
  managerMenuSections: LayoutMenuSection[]
  mobileMenuOpen: boolean
  onMenuItemSelect: (item: LayoutMenuItem) => void
  openDropdown: LayoutDropdownKey | null
  secondaryNavLinks: LayoutNavLink[]
  toggleDropdown: (dropdown: LayoutDropdownKey) => void
}

function renderTopNavLink(link: LayoutNavLink) {
  return (
    <NavLink
      key={link.to}
      end
      to={link.to}
      className={({ isActive }) => (
        isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
      )}
    >
      {link.label}
    </NavLink>
  )
}

export default function LayoutNavigation({
  analysisOperationsMenuSections,
  closeMenus,
  configSection,
  fleetSimEnabled,
  isAnalysisOpsActive,
  isConfigPage,
  isFleetSimActive,
  isManagerActive,
  locationPathname,
  managerMenuSections,
  mobileMenuOpen,
  onMenuItemSelect,
  openDropdown,
  secondaryNavLinks,
  toggleDropdown,
}: LayoutNavigationProps) {
  const renderMenuItem = (
    item: LayoutMenuItem,
    key: string,
    className: string,
    activeClassName: string,
    useMenuRole: boolean,
  ) => {
    const active = isLayoutMenuItemActive(
      item,
      locationPathname,
      isConfigPage,
      configSection,
    )
    const roleProps = useMenuRole ? { role: 'menuitem' as const } : {}

    if (item.kind === 'config') {
      return (
        <button
          key={key}
          type="button"
          {...roleProps}
          className={`${className} ${active ? activeClassName : ''}`}
          onClick={() => onMenuItemSelect(item)}
        >
          {item.label}
        </button>
      )
    }

    return (
      <NavLink
        key={key}
        {...roleProps}
        to={item.to}
        className={`${className} ${active ? activeClassName : ''}`}
        onClick={closeMenus}
      >
        {item.label}
      </NavLink>
    )
  }

  const renderDropdownMenu = (
    sections: LayoutMenuSection[],
    className: string,
    label: string,
  ) => (
    <div className={className} role="menu" aria-label={label}>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={`${label}-${section.title || sectionIndex}`}>
          {sectionIndex > 0 ? <div className={styles.dropdownDivider} /> : null}
          {section.title ? (
            <div className={styles.dropdownSectionLabel}>{section.title}</div>
          ) : null}
          {section.items.map((item) =>
            renderMenuItem(
              item,
              `${label}-${section.title || 'items'}-${item.label}`,
              styles.dropdownItem,
              styles.dropdownItemActive,
              true,
            ),
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const renderMobileMenuSection = (
    title: string,
    sections: LayoutMenuSection[],
  ) => (
    <div className={styles.mobileNavSection}>
      <div className={styles.mobileNavSectionTitle}>{title}</div>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={`${title}-${section.title || sectionIndex}`}>
          {section.title ? (
            <div className={styles.mobileNavSubsectionTitle}>
              {section.title}
            </div>
          ) : null}
          {section.items.map((item) =>
            renderMenuItem(
              item,
              `${title}-${section.title || 'items'}-${item.label}`,
              styles.mobileNavLink,
              styles.mobileNavLinkActive,
              false,
            ),
          )}
        </React.Fragment>
      ))}
    </div>
  )

  return (
    <nav className={styles.nav} aria-label="Global navigation">
      <div
        className={styles.navSection}
        role="group"
        aria-label="Primary navigation"
      >
        {PRIMARY_NAV_LINKS.map(renderTopNavLink)}
      </div>

      <div className={styles.navDivider} />

      <div
        className={`${styles.navSection} ${styles.navSectionSecondary}`}
        role="group"
        aria-label="Secondary navigation"
      >
        {secondaryNavLinks.map(renderTopNavLink)}
        <div className={styles.navDropdown}>
          <button
            type="button"
            aria-expanded={openDropdown === 'manager'}
            aria-haspopup="menu"
            className={`${styles.navLink} ${isManagerActive ? styles.navLinkActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleDropdown('manager')
            }}
          >
            Manager
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`${styles.dropdownArrow} ${openDropdown === 'manager' ? styles.dropdownArrowOpen : ''}`}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openDropdown === 'manager'
            ? renderDropdownMenu(
                managerMenuSections,
                styles.dropdownMenu,
                'Manager',
              )
            : null}
        </div>
        {fleetSimEnabled ? (
          <div className={styles.navDropdown}>
            <button
              type="button"
              aria-expanded={openDropdown === 'fleetSim'}
              aria-haspopup="menu"
              className={`${styles.navLink} ${isFleetSimActive ? styles.navLinkActive : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('fleetSim')
              }}
            >
              Simulator
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`${styles.dropdownArrow} ${openDropdown === 'fleetSim' ? styles.dropdownArrowOpen : ''}`}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {openDropdown === 'fleetSim'
              ? renderDropdownMenu(
                  FLEET_SIM_MENU_SECTIONS,
                  styles.dropdownMenu,
                  'Simulator',
                )
              : null}
          </div>
        ) : null}
        <div className={styles.navDropdown}>
          <button
            type="button"
            aria-expanded={openDropdown === 'analysisOps'}
            aria-haspopup="menu"
            className={`${styles.navLink} ${isAnalysisOpsActive ? styles.navLinkActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleDropdown('analysisOps')
            }}
          >
            System
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`${styles.dropdownArrow} ${openDropdown === 'analysisOps' ? styles.dropdownArrowOpen : ''}`}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openDropdown === 'analysisOps'
            ? renderDropdownMenu(
                analysisOperationsMenuSections,
                styles.dropdownMenuRight,
                'System',
              )
            : null}
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className={styles.mobileNav}>
          {PRIMARY_NAV_LINKS.map((link) => (
            <NavLink
              key={`mobile-${link.to}`}
              end
              to={link.to}
              className={styles.mobileNavLink}
              onClick={closeMenus}
            >
              {link.label}
            </NavLink>
          ))}
          {secondaryNavLinks.map((link) => (
            <NavLink
              key={`mobile-${link.to}`}
              end
              to={link.to}
              className={styles.mobileNavLink}
              onClick={closeMenus}
            >
              {link.label}
            </NavLink>
          ))}
          {renderMobileMenuSection('Manager', managerMenuSections)}
          {fleetSimEnabled
            ? renderMobileMenuSection('Simulator', FLEET_SIM_MENU_SECTIONS)
            : null}
          {renderMobileMenuSection('System', analysisOperationsMenuSections)}
        </div>
      ) : null}
    </nav>
  )
}
