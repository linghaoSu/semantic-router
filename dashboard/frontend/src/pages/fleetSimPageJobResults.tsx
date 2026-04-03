import type { FleetSimJob } from "../utils/fleetSimApi"
import styles from "./FleetSimPage.module.css"
import {
  formatJobStatus,
  formatMoneyKusd,
  formatNumber,
  formatPercent,
  jobStatusClassName,
} from "./fleetSimPageSupport"

function humanizeKey(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function JobStatusBadge({ status }: { status: FleetSimJob["status"] }) {
  return <span className={jobStatusClassName(status)}>{formatJobStatus(status)}</span>
}

export function JobResultSummary({ job }: { job: FleetSimJob }) {
  if (job.status === "failed") {
    return <p className={`${styles.message} ${styles.messageError}`}>{job.error || "Job failed"}</p>
  }

  if (job.result_optimize) {
    const best = job.result_optimize.best
    const sourceLabel =
      best.source === "simulated"
        ? "Simulation-validated recommendation"
        : best.source === "analytical"
          ? "Analytical recommendation"
          : humanizeKey(best.source)
    return (
      <div className={styles.resultSummary}>
        <div className={styles.resultSummaryHeader}>
          <div>
            <span className={styles.resultEyebrow}>Optimize result</span>
            <h4 className={styles.resultTitle}>Recommended fleet split</h4>
            <p className={styles.resultDescription}>
              {sourceLabel} for the selected traffic target.
            </p>
          </div>
          <span
            className={`${styles.resultPill} ${best.slo_met ? styles.resultPillSuccess : styles.resultPillWarning}`}
          >
            {best.slo_met ? "SLO matched" : "Needs review"}
          </span>
        </div>
        <div className={styles.resultGrid}>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Best gamma</span>
            <span className={styles.resultMetricValue}>{best.gamma.toFixed(2)}</span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Fleet GPUs</span>
            <span className={styles.resultMetricValue}>{formatNumber(best.total_gpus)}</span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Annual cost</span>
            <span className={styles.resultMetricValue}>{formatMoneyKusd(best.annual_cost_kusd)}</span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Savings vs baseline</span>
            <span className={styles.resultMetricValue}>{job.result_optimize.savings_pct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    )
  }

  if (job.result_simulate) {
    return (
      <div className={styles.resultSummary}>
        <div className={styles.resultSummaryHeader}>
          <div>
            <span className={styles.resultEyebrow}>Simulation result</span>
            <h4 className={styles.resultTitle}>Saved fleet replay</h4>
            <p className={styles.resultDescription}>
              Replay outcome for the selected fleet and traffic input.
            </p>
          </div>
          <span
            className={`${styles.resultPill} ${
              job.result_simulate.fleet_slo_compliance >= 0.95
                ? styles.resultPillSuccess
                : styles.resultPillWarning
            }`}
          >
            {formatPercent(job.result_simulate.fleet_slo_compliance)} hit rate
          </span>
        </div>
        <div className={styles.resultGrid}>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Fleet P99 TTFT</span>
            <span className={styles.resultMetricValue}>
              {formatNumber(job.result_simulate.fleet_p99_ttft_ms, 1)} ms
            </span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Mean utilization</span>
            <span className={styles.resultMetricValue}>
              {formatPercent(job.result_simulate.fleet_mean_utilisation)}
            </span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Fleet GPUs</span>
            <span className={styles.resultMetricValue}>{formatNumber(job.result_simulate.total_gpus)}</span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Annual cost</span>
            <span className={styles.resultMetricValue}>
              {formatMoneyKusd(job.result_simulate.annual_cost_kusd)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (job.result_whatif) {
    const maxLam = job.result_whatif.points.reduce(
      (current, point) => Math.max(current, point.lam),
      0
    )
    return (
      <div className={styles.resultSummary}>
        <div className={styles.resultSummaryHeader}>
          <div>
            <span className={styles.resultEyebrow}>What-if result</span>
            <h4 className={styles.resultTitle}>Traffic envelope</h4>
            <p className={styles.resultDescription}>
              Arrival-rate sweep for one saved fleet configuration.
            </p>
          </div>
          <span
            className={`${styles.resultPill} ${
              job.result_whatif.slo_break_lam != null
                ? styles.resultPillWarning
                : styles.resultPillSuccess
            }`}
          >
            {job.result_whatif.slo_break_lam != null ? "Break point found" : "Stable across sweep"}
          </span>
        </div>
        <div className={styles.resultGrid}>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Sweep points</span>
            <span className={styles.resultMetricValue}>
              {formatNumber(job.result_whatif.points.length)}
            </span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Break lambda</span>
            <span className={styles.resultMetricValue}>
              {job.result_whatif.slo_break_lam != null
                ? formatNumber(job.result_whatif.slo_break_lam, 1)
                : "Stable"}
            </span>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Highest tested lambda</span>
            <span className={styles.resultMetricValue}>{formatNumber(maxLam, 1)}</span>
          </div>
        </div>
      </div>
    )
  }

  return <p className={styles.message}>Result pending.</p>
}

export function JobResultRows({ job }: { job: FleetSimJob }) {
  if (job.status === "failed") {
    return <p className={`${styles.message} ${styles.messageError}`}>{job.error || "Job failed"}</p>
  }

  if (job.result_optimize) {
    const best = job.result_optimize.best
    return (
      <div className={styles.inlineDetails}>
        <div className={styles.inlineDetailRow}>
          <span className={styles.inlineDetailLabel}>Result</span>
          <span className={styles.inlineDetailValue}>Recommended fleet split</span>
        </div>
        <div className={styles.inlineDetailGrid}>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Best gamma</span>
            <span className={styles.inlineDetailValue}>{best.gamma.toFixed(2)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Fleet GPUs</span>
            <span className={styles.inlineDetailValue}>{formatNumber(best.total_gpus)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Annual cost</span>
            <span className={styles.inlineDetailValue}>{formatMoneyKusd(best.annual_cost_kusd)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Savings</span>
            <span className={styles.inlineDetailValue}>{job.result_optimize.savings_pct.toFixed(1)}%</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>SLO</span>
            <span className={styles.inlineDetailValue}>{best.slo_met ? "Matched" : "Needs review"}</span>
          </div>
        </div>
      </div>
    )
  }

  if (job.result_simulate) {
    return (
      <div className={styles.inlineDetails}>
        <div className={styles.inlineDetailRow}>
          <span className={styles.inlineDetailLabel}>Result</span>
          <span className={styles.inlineDetailValue}>Saved fleet replay</span>
        </div>
        <div className={styles.inlineDetailGrid}>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>P99 TTFT</span>
            <span className={styles.inlineDetailValue}>{formatNumber(job.result_simulate.fleet_p99_ttft_ms, 1)} ms</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Hit rate</span>
            <span className={styles.inlineDetailValue}>{formatPercent(job.result_simulate.fleet_slo_compliance)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Utilization</span>
            <span className={styles.inlineDetailValue}>{formatPercent(job.result_simulate.fleet_mean_utilisation)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Fleet GPUs</span>
            <span className={styles.inlineDetailValue}>{formatNumber(job.result_simulate.total_gpus)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Annual cost</span>
            <span className={styles.inlineDetailValue}>{formatMoneyKusd(job.result_simulate.annual_cost_kusd)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (job.result_whatif) {
    const maxLam = job.result_whatif.points.reduce((current, point) => Math.max(current, point.lam), 0)
    return (
      <div className={styles.inlineDetails}>
        <div className={styles.inlineDetailRow}>
          <span className={styles.inlineDetailLabel}>Result</span>
          <span className={styles.inlineDetailValue}>Traffic envelope</span>
        </div>
        <div className={styles.inlineDetailGrid}>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Sweep points</span>
            <span className={styles.inlineDetailValue}>{formatNumber(job.result_whatif.points.length)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Break lambda</span>
            <span className={styles.inlineDetailValue}>
              {job.result_whatif.slo_break_lam != null ? formatNumber(job.result_whatif.slo_break_lam, 1) : "Stable"}
            </span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Highest tested</span>
            <span className={styles.inlineDetailValue}>{formatNumber(maxLam, 1)}</span>
          </div>
          <div className={styles.inlineDetailCell}>
            <span className={styles.inlineDetailLabel}>Sweep status</span>
            <span className={styles.inlineDetailValue}>
              {job.result_whatif.slo_break_lam != null ? "Break point found" : "Stable across sweep"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return <p className={styles.message}>Result pending.</p>
}
