
import styles from "./DashboardStatsGrid.module.css"
import { useMemo } from "react";
import { getModelStatusSummary, SystemStatus } from "../utils/routerRuntime";
import { useNavigate } from 'react-router-dom'

const ModelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="18" rx="3" />
    <path d="M8 7v10M12 7v10M16 7v10" />
  </svg>
)

const DecisionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M4 6h16M4 12h8M4 18h12" />
  </svg>
)

const SignalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

const ServicesHealthyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

const ModelStatusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v10" />
    <path d="M8.5 9.5 12 13l3.5-3.5" />
    <path d="M4 19h16" />
  </svg>
)

export const DashboardStatsGrid: React.FC<{
  signals: { total: number; byType: Record<string, number> }
  status: SystemStatus | null,
  modelCount?: number,
  decisionCount?: number,
}> = ({ signals, status, modelCount, decisionCount }) => {
  const navigate = useNavigate()

  const healthyServices = useMemo(() => status?.services.filter(s => s.healthy).length ?? 0, [status])

  const totalServices = useMemo(() => status?.services.length ?? 0, [status])
  const modelStatus = useMemo(() => getModelStatusSummary(status), [status])

  return (
    <div className={styles.statsGrid}>
      <button className={styles.statCard} onClick={() => navigate('/config/models')}>
        <div className={styles.statIcon} style={{ background: 'var(--color-accent-purple)', boxShadow: 'var(--glow-purple)' }}>
          <ModelIcon></ModelIcon>
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{modelCount}</span>
          <span className={styles.statLabel}>Models</span>
        </div>
        <span className={styles.statArrow}>&rsaquo;</span>
      </button>

      <button className={styles.statCard} onClick={() => navigate('/config/decisions')}>
        <div className={styles.statIcon} style={{ background: 'var(--color-accent-cyan)', boxShadow: 'var(--glow-cyan)' }}>
          <DecisionIcon></DecisionIcon>
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{decisionCount}</span>
          <span className={styles.statLabel}>Decisions</span>
        </div>
        <span className={styles.statArrow}>&rsaquo;</span>
      </button>

      <button className={styles.statCard} onClick={() => navigate('/config/signals')}>
        <div className={styles.statIcon} style={{ background: 'var(--color-primary)', boxShadow: 'var(--glow-primary)' }}>
          <SignalIcon></SignalIcon>
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{signals.total}</span>
          <span className={styles.statLabel}>Signals</span>
        </div>
        <span className={styles.statArrow}>&rsaquo;</span>
      </button>

      <button className={styles.statCard} onClick={() => navigate('/status')}>
        <div className={`${styles.statIcon} ${status?.overall === 'healthy' ? styles.statIconHealthy :
          status?.overall === 'degraded' ? styles.statIconDegraded :
            styles.statIconDown
          }`}>
          <ServicesHealthyIcon />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{healthyServices}/{totalServices}</span>
          <span className={styles.statLabel}>Services Healthy</span>
        </div>
        <span className={styles.statArrow}>&rsaquo;</span>
      </button>

      <button className={styles.statCard} onClick={() => navigate('/status')}>
        <div className={`${styles.statIcon} ${modelStatus.tone === 'ok' ? styles.statIconHealthy :
          modelStatus.tone === 'warn' ? styles.statIconStarting :
            styles.statIconDown
          }`}>
          <ModelStatusIcon />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{modelStatus.value}</span>
          <span className={styles.statLabel}>Model Status</span>
          <span className={styles.statDetail}>{modelStatus.detail}</span>
        </div>
        <span className={styles.statArrow}>&rsaquo;</span>
      </button>
    </div>)
};

DashboardStatsGrid.displayName = "DashboardStatsGrid"
