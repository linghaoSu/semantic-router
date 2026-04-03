import TableHeader from "../components/TableHeader"
import { DataTable, type Column } from "../components/DataTable"

import type {
  BuiltinWorkload,
  FleetConfig,
  FleetSimJob,
  TraceInfo,
  WorkloadRef,
} from "../utils/fleetSimApi"
import styles from "./FleetSimPage.module.css"
import { formatDateTime, formatJobType } from "./fleetSimPageSupport"
import { JobResultRows } from "./fleetSimPageJobResults"

interface FleetSimRunsHistorySectionProps {
  expandedJobIDs: Set<string>
  fleets: FleetConfig[]
  jobColumns: Column<FleetSimJob>[]
  jobs: FleetSimJob[]
  traces: TraceInfo[]
  workloads: BuiltinWorkload[]
  onDeleteJob: (job: FleetSimJob) => void
  onToggleExpand: (job: FleetSimJob) => void
  resolveFleetLabel: (fleetID: string, fleets: FleetConfig[]) => string
  resolveWorkloadLabel: (
    workload: WorkloadRef | null | undefined,
    workloads: BuiltinWorkload[],
    traces: TraceInfo[]
  ) => string
  getFleetID: (job: FleetSimJob) => string
  getWorkload: (job: FleetSimJob) => WorkloadRef | null
}

export default function FleetSimRunsHistorySection({
  expandedJobIDs,
  fleets,
  jobColumns,
  jobs,
  traces,
  workloads,
  onDeleteJob,
  onToggleExpand,
  resolveFleetLabel,
  resolveWorkloadLabel,
  getFleetID,
  getWorkload,
}: FleetSimRunsHistorySectionProps) {
  return (
    <section className={styles.sectionCard}>
      <TableHeader title="Run History" count={jobs.length} variant="embedded" />
      <DataTable
        columns={jobColumns}
        data={jobs}
        keyExtractor={(row) => row.id}
        onDelete={(row) => void onDeleteJob(row)}
        expandable
        isRowExpanded={(row) => expandedJobIDs.has(row.id)}
        onToggleExpand={onToggleExpand}
        renderExpandedRow={(row) => {
          const workload = getWorkload(row)
          const fleetLabel = resolveFleetLabel(getFleetID(row), fleets)
          return (
            <div className={styles.expandedPanel}>
              <div className={styles.inlineDetailGrid}>
                <div className={styles.inlineDetailCell}>
                  <span className={styles.inlineDetailLabel}>Scenario</span>
                  <span className={styles.inlineDetailValue}>{formatJobType(row.type)}</span>
                </div>
                <div className={styles.inlineDetailCell}>
                  <span className={styles.inlineDetailLabel}>Workload</span>
                  <span className={styles.inlineDetailValue}>{resolveWorkloadLabel(workload, workloads, traces)}</span>
                </div>
                <div className={styles.inlineDetailCell}>
                  <span className={styles.inlineDetailLabel}>Fleet</span>
                  <span className={styles.inlineDetailValue}>{fleetLabel}</span>
                </div>
                <div className={styles.inlineDetailCell}>
                  <span className={styles.inlineDetailLabel}>Created</span>
                  <span className={styles.inlineDetailValue}>{formatDateTime(row.created_at)}</span>
                </div>
              </div>
              <JobResultRows job={row} />
            </div>
          )
        }}
        emptyMessage="No simulator jobs yet."
      />
    </section>
  )
}
