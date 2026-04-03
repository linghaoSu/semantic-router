import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { SystemStatus } from '../utils/routerRuntime'
import { SIGNAL_COLORS } from './dashboardSupport'
import styles from './DashboardPage.module.css'

/* ------------------------------------------------------------------ */
/*  System Health Card                                                 */
/* ------------------------------------------------------------------ */

interface DashboardHealthCardProps {
  status: SystemStatus | null
}

export const DashboardHealthCard: React.FC<DashboardHealthCardProps> = ({ status }) => {
  const navigate = useNavigate()

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>System Health</h2>
        <button className={styles.cardAction} onClick={() => navigate('/status')}>
          Details &rsaquo;
        </button>
      </div>
      <div className={styles.healthContent}>
        {status ? (
          <>
            <div className={styles.healthOverall}>
              <span className={`${styles.healthDot} ${status.overall === 'healthy' ? styles.healthDotGreen :
                status.overall === 'degraded' ? styles.healthDotYellow :
                  styles.healthDotRed
                }`} />
              <span className={styles.healthLabel}>
                {status.overall === 'not_running' ? 'Not Running' :
                  status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
              </span>
              {status.version && <span className={styles.versionBadge}>v{status.version}</span>}
              {status.deployment_type && status.deployment_type !== 'none' && (
                <span className={styles.deployBadge}>{status.deployment_type}</span>
              )}
            </div>
            <div className={styles.servicesList}>
              {status.services.slice(0, 6).map((svc, i) => (
                <div key={i} className={styles.serviceRow}>
                  <span className={`${styles.svcDot} ${svc.healthy ? styles.svcDotOk : styles.svcDotFail}`} />
                  <span className={styles.svcName}>{svc.name}</span>
                  <span className={`${styles.svcStatus} ${svc.healthy ? styles.svcStatusOk : styles.svcStatusFail}`}>
                    {svc.status}
                  </span>
                </div>
              ))}
              {status.services.length > 6 && (
                <div className={styles.moreServices}>+{status.services.length - 6} more</div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>Unable to fetch status</div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Quick Actions Card                                                 */
/* ------------------------------------------------------------------ */

interface DashboardQuickActionsProps {
  showMLSetupQuickLink: boolean
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ showMLSetupQuickLink }) => {
  const navigate = useNavigate()

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Quick Actions</h2>
      </div>
      <div className={styles.quickLinks}>
        <button className={styles.quickLink} onClick={() => navigate('/playground')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Test in Playground
        </button>
        <button className={styles.quickLink} onClick={() => navigate('/builder')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
          Open Builder
        </button>
        <button className={styles.quickLink} onClick={() => navigate('/topology')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          View Topology
        </button>
        <button className={styles.quickLink} onClick={() => navigate('/evaluation')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          Run Evaluation
        </button>
        {showMLSetupQuickLink ? (
          <button className={styles.quickLink} onClick={() => navigate('/ml-setup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            ML Setup
          </button>
        ) : null}
        <button className={styles.quickLink} onClick={() => navigate('/config/models')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="18" rx="3" /><path d="M8 7v10M16 7v10" />
          </svg>
          Manage Models
        </button>
        <button className={styles.quickLink} onClick={() => navigate('/config/decisions')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h8M4 18h12" />
          </svg>
          Manage Decisions
        </button>
        <button className={styles.quickLink} onClick={() => navigate('/config/signals')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 20V10M18 20V4M6 20v-4" />
          </svg>
          Manage Signals
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Signal Breakdown Card                                              */
/* ------------------------------------------------------------------ */

interface DashboardSignalBreakdownProps {
  signalStats: { total: number; byType: Record<string, number> }
}

export const DashboardSignalBreakdown: React.FC<DashboardSignalBreakdownProps> = ({ signalStats }) => {
  if (signalStats.total <= 0) return null

  const maxCount = Math.max(...Object.values(signalStats.byType))

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Signal Breakdown</h2>
        <span className={styles.cardSubtitle}>{signalStats.total} total</span>
      </div>
      <div className={styles.signalBreakdown}>
        {Object.entries(signalStats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
          const pct = Math.round((count / maxCount) * 100)
          const color = SIGNAL_COLORS[type] || '#999'
          return (
            <div key={type} className={styles.breakdownRow} title={`${type}: ${count} signal(s)`}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDot} style={{ background: color }} />
                {type}
              </span>
              <div className={styles.breakdownBar}>
                <div className={styles.breakdownFill} style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className={styles.breakdownCount}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
