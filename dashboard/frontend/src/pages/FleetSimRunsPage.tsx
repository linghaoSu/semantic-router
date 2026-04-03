import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Column } from '../components/DataTable'
import FleetSimSurfaceLayout from './FleetSimSurfaceLayout'
import FleetSimRunsComposer from './FleetSimRunsComposer'
import FleetSimRunsHistorySection from './FleetSimRunsHistorySection'
import styles from './FleetSimPage.module.css'
import {
  createJob,
  deleteJob,
  listFleets,
  listJobs,
  listTraces,
  listWorkloads,
  type FleetConfig,
  type FleetSimJob,
  type FleetSimJobType,
  type TraceInfo,
  type WorkloadRef,
  type BuiltinWorkload,
} from '../utils/fleetSimApi'
import {
  extractJobFleetID,
  extractJobWorkload,
  formatBuiltinWorkloadName,
  formatDateTime,
  formatJobType,
  formatNumber,
} from './fleetSimPageSupport'
import { JobStatusBadge } from './fleetSimPageJobResults'

function buildWorkloadRef(workloadMode: 'builtin' | 'trace', builtinName: string, traceID: string): WorkloadRef {
  if (workloadMode === 'trace') {
    return { type: 'trace', trace_id: traceID }
  }
  return { type: 'builtin', name: builtinName }
}

function resolveWorkloadLabel(
  workload: WorkloadRef | null | undefined,
  workloads: BuiltinWorkload[],
  traces: TraceInfo[]
): string {
  if (!workload) return 'Traffic input pending'
  if (workload.type === 'trace') {
    return traces.find((trace) => trace.id === workload.trace_id)?.name || 'Uploaded trace'
  }
  const builtinName = workload.name || workloads[0]?.name || 'builtin'
  return formatBuiltinWorkloadName(builtinName)
}

function resolveFleetLabel(fleetID: string, fleets: FleetConfig[]): string {
  if (fleetID === 'Search mode') return fleetID
  return fleets.find((fleet) => fleet.id === fleetID)?.name || fleetID
}

async function fetchRunsPageData() {
  const [workloadsData, tracesData, fleetsData, jobsData] = await Promise.all([
    listWorkloads(),
    listTraces(),
    listFleets(),
    listJobs(),
  ])
  return {
    workloadsData,
    tracesData,
    fleetsData,
    jobsData: jobsData.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
  }
}

function applyRunsPageData(
  data: Awaited<ReturnType<typeof fetchRunsPageData>>,
  state: {
    fleetID: string
    traceID: string
    setWorkloads: Dispatch<SetStateAction<BuiltinWorkload[]>>
    setTraces: Dispatch<SetStateAction<TraceInfo[]>>
    setFleets: Dispatch<SetStateAction<FleetConfig[]>>
    setJobs: Dispatch<SetStateAction<FleetSimJob[]>>
    setFleetID: Dispatch<SetStateAction<string>>
    setTraceID: Dispatch<SetStateAction<string>>
  }
) {
  const { workloadsData, tracesData, fleetsData, jobsData } = data
  const {
    fleetID,
    traceID,
    setWorkloads,
    setTraces,
    setFleets,
    setJobs,
    setFleetID,
    setTraceID,
  } = state

  setWorkloads(workloadsData)
  setTraces(tracesData)
  setFleets(fleetsData)
  setJobs(jobsData)
  if (!fleetID && fleetsData[0]) {
    setFleetID(fleetsData[0].id)
  }
  if (!traceID && tracesData[0]) {
    setTraceID(tracesData[0].id)
  }
}

export default function FleetSimRunsPage() {
  const [jobType, setJobType] = useState<FleetSimJobType>('optimize')
  const [workloads, setWorkloads] = useState<BuiltinWorkload[]>([])
  const [traces, setTraces] = useState<TraceInfo[]>([])
  const [fleets, setFleets] = useState<FleetConfig[]>([])
  const [jobs, setJobs] = useState<FleetSimJob[]>([])
  const [expandedJobIDs, setExpandedJobIDs] = useState<Set<string>>(new Set())
  const [workloadMode, setWorkloadMode] = useState<'builtin' | 'trace'>('builtin')
  const [builtinName, setBuiltinName] = useState('azure')
  const [traceID, setTraceID] = useState('')
  const [fleetID, setFleetID] = useState('')
  const [lam, setLam] = useState('200')
  const [sloMs, setSloMs] = useState('500')
  const [nRequests, setNRequests] = useState('20000')
  const [lamRange, setLamRange] = useState('100, 200, 300, 500')
  const [bShort, setBShort] = useState('4096')
  const [gpuShort, setGpuShort] = useState('a100')
  const [gpuLong, setGpuLong] = useState('h100')
  const [longMaxCtx, setLongMaxCtx] = useState('65536')
  const [gammaMin, setGammaMin] = useState('1.0')
  const [gammaMax, setGammaMax] = useState('2.0')
  const [gammaStep, setGammaStep] = useState('0.1')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadWithErrors = async () => {
      try {
        const data = await fetchRunsPageData()
        if (cancelled) return
        applyRunsPageData(data, {
          fleetID,
          traceID,
          setWorkloads,
          setTraces,
          setFleets,
          setJobs,
          setFleetID,
          setTraceID,
        })
        if (!cancelled) setError('')
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load simulator runs')
      }
    }

    void loadWithErrors()
    const intervalID = window.setInterval(() => {
      void loadWithErrors()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalID)
    }
  }, [fleetID, traceID])

  const lambdaValues = lamRange
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value))
  const selectedTrace = traces.find((trace) => trace.id === traceID)
  const selectedFleet = fleets.find((fleet) => fleet.id === fleetID)
  const selectedWorkloadLabel = resolveWorkloadLabel(
    workloadMode === 'trace'
      ? { type: 'trace', trace_id: traceID }
      : { type: 'builtin', name: builtinName },
    workloads,
    traces
  )

  const handleSubmit = async () => {
    try {
      if (workloadMode === 'trace' && !traceID) {
        throw new Error('Select an uploaded trace before submitting this run.')
      }
      const workload = buildWorkloadRef(workloadMode, builtinName, traceID)
      let payload: Record<string, unknown>

      if (jobType === 'optimize') {
        payload = {
          type: 'optimize',
          optimize: {
            workload,
            lam: Number(lam),
            slo_ms: Number(sloMs),
            b_short: Number(bShort),
            gpu_short: gpuShort,
            gpu_long: gpuLong,
            long_max_ctx: Number(longMaxCtx),
            gamma_min: Number(gammaMin),
            gamma_max: Number(gammaMax),
            gamma_step: Number(gammaStep),
            n_sim_requests: Number(nRequests),
          },
        }
      } else if (jobType === 'simulate') {
        if (!fleetID) {
          throw new Error('Save or select a fleet before running a simulation.')
        }
        payload = {
          type: 'simulate',
          simulate: {
            workload,
            fleet_id: fleetID,
            lam: Number(lam),
            slo_ms: Number(sloMs),
            n_requests: Number(nRequests),
          },
        }
      } else {
        if (!fleetID) {
          throw new Error('Save or select a fleet before running a what-if sweep.')
        }
        if (lambdaValues.length === 0) {
          throw new Error('Add at least one arrival-rate checkpoint for the what-if sweep.')
        }
        payload = {
          type: 'whatif',
          whatif: {
            workload,
            fleet_id: fleetID,
            lam_range: lambdaValues,
            slo_ms: Number(sloMs),
            n_requests: Number(nRequests),
          },
        }
      }

      const created = await createJob(payload)
      setMessage(`Submitted ${created.type} job ${created.id}`)
      setError('')
      applyRunsPageData(await fetchRunsPageData(), {
        fleetID,
        traceID,
        setWorkloads,
        setTraces,
        setFleets,
        setJobs,
        setFleetID,
        setTraceID,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit job')
    }
  }

  const handleDeleteJob = async (job: FleetSimJob) => {
    try {
      await deleteJob(job.id)
      setMessage(`Deleted job ${job.id}`)
      setError('')
      applyRunsPageData(await fetchRunsPageData(), {
        fleetID,
        traceID,
        setWorkloads,
        setTraces,
        setFleets,
        setJobs,
        setFleetID,
        setTraceID,
      })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete job')
    }
  }

  const jobColumns: Column<FleetSimJob>[] = [
    {
      key: 'type',
      header: 'Run',
      sortable: true,
      render: (row) => (
        <div className={styles.compactListMeta}>
          <span className={styles.compactListTitle}>{formatJobType(row.type)}</span>
          <span className={styles.compactListText}>{formatDateTime(row.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <JobStatusBadge status={row.status} />,
    },
    {
      key: 'workload',
      header: 'Workload',
      render: (row) => {
        const workload = extractJobWorkload(row)
        return resolveWorkloadLabel(workload, workloads, traces)
      },
    },
    {
      key: 'fleet',
      header: 'Fleet',
      render: (row) => resolveFleetLabel(extractJobFleetID(row), fleets),
    },
  ]

  return (
    <FleetSimSurfaceLayout
      title="Runs"
      description="Launch planning scenarios, compare saved fleet behavior, and keep a readable history of the decisions behind each run."
      currentPath="/fleet-sim/runs"
      meta={[
        { label: 'Saved fleets', value: formatNumber(fleets.length) },
        { label: 'Run history', value: formatNumber(jobs.length) },
        { label: 'Trace options', value: formatNumber(traces.length) },
      ]}
    >
      <FleetSimRunsComposer
        bShort={bShort}
        builtinName={builtinName}
        error={error}
        fleetID={fleetID}
        fleets={fleets}
        gammaMax={gammaMax}
        gammaMin={gammaMin}
        gammaStep={gammaStep}
        gpuLong={gpuLong}
        gpuShort={gpuShort}
        jobType={jobType}
        lam={lam}
        lamRange={lamRange}
        lambdaValues={lambdaValues}
        longMaxCtx={longMaxCtx}
        message={message}
        nRequests={nRequests}
        selectedFleet={selectedFleet}
        selectedTrace={selectedTrace}
        selectedWorkloadLabel={selectedWorkloadLabel}
        sloMs={sloMs}
        traceID={traceID}
        traces={traces}
        workloads={workloads}
        workloadMode={workloadMode}
        onBShortChange={setBShort}
        onBuiltinNameChange={setBuiltinName}
        onFleetIDChange={setFleetID}
        onGammaMaxChange={setGammaMax}
        onGammaMinChange={setGammaMin}
        onGammaStepChange={setGammaStep}
        onGpuLongChange={setGpuLong}
        onGpuShortChange={setGpuShort}
        onJobTypeChange={setJobType}
        onLamChange={setLam}
        onLamRangeChange={setLamRange}
        onLongMaxCtxChange={setLongMaxCtx}
        onNRequestsChange={setNRequests}
        onSloMsChange={setSloMs}
        onSubmit={() => void handleSubmit()}
        onTraceIDChange={setTraceID}
        onWorkloadModeChange={setWorkloadMode}
      />

      <FleetSimRunsHistorySection
        expandedJobIDs={expandedJobIDs}
        fleets={fleets}
        jobColumns={jobColumns}
        jobs={jobs}
        traces={traces}
        workloads={workloads}
        onDeleteJob={handleDeleteJob}
        onToggleExpand={(row) => {
          setExpandedJobIDs((current) => {
            const next = new Set(current)
            if (next.has(row.id)) next.delete(row.id)
            else next.add(row.id)
            return next
          })
        }}
        resolveFleetLabel={resolveFleetLabel}
        resolveWorkloadLabel={resolveWorkloadLabel}
        getFleetID={extractJobFleetID}
        getWorkload={extractJobWorkload}
      />
    </FleetSimSurfaceLayout>
  )
}
