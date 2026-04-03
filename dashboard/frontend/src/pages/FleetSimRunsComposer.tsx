import type {
  BuiltinWorkload,
  FleetConfig,
  FleetSimJobType,
  TraceInfo,
} from "../utils/fleetSimApi"

import styles from "./FleetSimPage.module.css"
import {
  describeJobType,
  formatBuiltinWorkloadName,
  formatGpuLabel,
  formatJobType,
  formatNumber,
} from "./fleetSimPageSupport"

const GPU_OPTIONS = ['a100', 'h100', 'a10g']
const RUN_TYPE_OPTIONS = [
  { value: 'optimize', title: 'Optimize' },
  { value: 'simulate', title: 'Simulate' },
  { value: 'whatif', title: 'What-if' },
] as const
const WORKLOAD_SOURCE_OPTIONS = [
  { value: 'builtin', title: 'Built-in library', description: 'Use a reusable planning profile.' },
  { value: 'trace', title: 'Uploaded trace', description: 'Replay a saved traffic slice from this workspace.' },
] as const

interface FleetSimRunsComposerProps {
  bShort: string
  builtinName: string
  error: string
  fleetID: string
  fleets: FleetConfig[]
  gammaMax: string
  gammaMin: string
  gammaStep: string
  gpuLong: string
  gpuShort: string
  jobType: FleetSimJobType
  lam: string
  lamRange: string
  lambdaValues: number[]
  longMaxCtx: string
  message: string
  nRequests: string
  selectedFleet?: FleetConfig
  selectedTrace?: TraceInfo
  selectedWorkloadLabel: string
  sloMs: string
  traceID: string
  traces: TraceInfo[]
  workloads: BuiltinWorkload[]
  workloadMode: 'builtin' | 'trace'
  onBShortChange: (value: string) => void
  onBuiltinNameChange: (value: string) => void
  onFleetIDChange: (value: string) => void
  onGammaMaxChange: (value: string) => void
  onGammaMinChange: (value: string) => void
  onGammaStepChange: (value: string) => void
  onGpuLongChange: (value: string) => void
  onGpuShortChange: (value: string) => void
  onJobTypeChange: (value: FleetSimJobType) => void
  onLamChange: (value: string) => void
  onLamRangeChange: (value: string) => void
  onLongMaxCtxChange: (value: string) => void
  onNRequestsChange: (value: string) => void
  onSloMsChange: (value: string) => void
  onSubmit: () => void
  onTraceIDChange: (value: string) => void
  onWorkloadModeChange: (value: 'builtin' | 'trace') => void
}

export default function FleetSimRunsComposer({
  bShort,
  builtinName,
  error,
  fleetID,
  fleets,
  gammaMax,
  gammaMin,
  gammaStep,
  gpuLong,
  gpuShort,
  jobType,
  lam,
  lamRange,
  lambdaValues,
  longMaxCtx,
  message,
  nRequests,
  selectedFleet,
  selectedTrace,
  selectedWorkloadLabel,
  sloMs,
  traceID,
  traces,
  workloads,
  workloadMode,
  onBShortChange,
  onBuiltinNameChange,
  onFleetIDChange,
  onGammaMaxChange,
  onGammaMinChange,
  onGammaStepChange,
  onGpuLongChange,
  onGpuShortChange,
  onJobTypeChange,
  onLamChange,
  onLamRangeChange,
  onLongMaxCtxChange,
  onNRequestsChange,
  onSloMsChange,
  onSubmit,
  onTraceIDChange,
  onWorkloadModeChange,
}: FleetSimRunsComposerProps) {
  return (
    <div className={styles.composerSplit}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Scenario builder</span>
            <h2 className={styles.sectionTitle}>Submit run</h2>
            <p className={styles.sectionDescription}>Build a scenario in dashboard terms first, then let the simulator fill in the numbers behind it.</p>
          </div>
        </div>
        <div className={styles.formStack}>
          <div className={styles.fieldSection}>
            <div>
              <span className={styles.sectionKicker}>Run type</span>
              <p className={styles.sectionDescription}>Choose whether you want a fresh recommendation, a replay, or a saturation check.</p>
            </div>
            <div className={styles.choiceGrid}>
              {RUN_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.choiceButton} ${jobType === option.value ? styles.choiceButtonActive : ''}`}
                  onClick={() => onJobTypeChange(option.value)}
                >
                  <span className={styles.choiceButtonTitle}>{option.title}</span>
                  <span className={styles.choiceButtonDescription}>{describeJobType(option.value)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldSection}>
            <div>
              <span className={styles.sectionKicker}>Traffic input</span>
              <p className={styles.sectionDescription}>Pick the source you want the run to reflect, then set the core demand target.</p>
            </div>
            <div className={styles.choiceGrid}>
              {WORKLOAD_SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.choiceButton} ${workloadMode === option.value ? styles.choiceButtonActive : ''}`}
                  onClick={() => onWorkloadModeChange(option.value)}
                >
                  <span className={styles.choiceButtonTitle}>{option.title}</span>
                  <span className={styles.choiceButtonDescription}>{option.description}</span>
                </button>
              ))}
            </div>
            <div className={styles.formGrid}>
              {workloadMode === 'builtin' ? (
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Built-in profile</span>
                  <select className={styles.select} value={builtinName} onChange={(event) => onBuiltinNameChange(event.target.value)}>
                    {workloads.map((workload) => (
                      <option key={workload.name} value={workload.name}>
                        {formatBuiltinWorkloadName(workload.name)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Uploaded trace</span>
                  <select className={styles.select} value={traceID} onChange={(event) => onTraceIDChange(event.target.value)}>
                    <option value="">Select trace</option>
                    {traces.map((trace) => (
                      <option key={trace.id} value={trace.id}>
                        {trace.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Arrival rate</span>
                <input className={styles.input} value={lam} onChange={(event) => onLamChange(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>SLO target (ms)</span>
                <input className={styles.input} value={sloMs} onChange={(event) => onSloMsChange(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Replay requests</span>
                <input className={styles.input} value={nRequests} onChange={(event) => onNRequestsChange(event.target.value)} />
              </label>
            </div>
          </div>

          {jobType !== 'optimize' ? (
            <div className={styles.fieldSection}>
              <div>
                <span className={styles.sectionKicker}>Fleet target</span>
                <p className={styles.sectionDescription}>Simulation and what-if runs stay comparable by reusing a saved fleet definition.</p>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Saved fleet</span>
                  <select className={styles.select} value={fleetID} onChange={(event) => onFleetIDChange(event.target.value)}>
                    <option value="">Select fleet</option>
                    {fleets.map((fleet) => (
                      <option key={fleet.id} value={fleet.id}>
                        {fleet.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {jobType === 'whatif' ? (
            <div className={styles.fieldSection}>
              <div>
                <span className={styles.sectionKicker}>Sweep range</span>
                <p className={styles.sectionDescription}>Provide the arrival-rate checkpoints you want the dashboard to test, separated by commas.</p>
              </div>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>Arrival-rate checkpoints</span>
                  <input className={styles.input} value={lamRange} onChange={(event) => onLamRangeChange(event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          {jobType === 'optimize' ? (
            <div className={styles.fieldSection}>
              <div>
                <span className={styles.sectionKicker}>Search space</span>
                <p className={styles.sectionDescription}>Define the short and long pool search bounds instead of typing raw solver parameters into one flat form.</p>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Short-context boundary</span>
                  <input className={styles.input} value={bShort} onChange={(event) => onBShortChange(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Short pool GPU</span>
                  <select className={styles.select} value={gpuShort} onChange={(event) => onGpuShortChange(event.target.value)}>
                    {GPU_OPTIONS.map((gpu) => (
                      <option key={gpu} value={gpu}>
                        {formatGpuLabel(gpu)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Long pool GPU</span>
                  <select className={styles.select} value={gpuLong} onChange={(event) => onGpuLongChange(event.target.value)}>
                    {GPU_OPTIONS.map((gpu) => (
                      <option key={gpu} value={gpu}>
                        {formatGpuLabel(gpu)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Long max context</span>
                  <input className={styles.input} value={longMaxCtx} onChange={(event) => onLongMaxCtxChange(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Gamma min</span>
                  <input className={styles.input} value={gammaMin} onChange={(event) => onGammaMinChange(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Gamma max</span>
                  <input className={styles.input} value={gammaMax} onChange={(event) => onGammaMaxChange(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Gamma step</span>
                  <input className={styles.input} value={gammaStep} onChange={(event) => onGammaStepChange(event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.buttonRow} style={{ marginTop: '1rem' }}>
          <button type="button" className={styles.primaryButton} onClick={onSubmit}>
            Submit Run
          </button>
          <span className={styles.inlineHint}>{describeJobType(jobType)}</span>
        </div>
        {message ? <p className={`${styles.message} ${styles.messageSuccess}`}>{message}</p> : null}
        {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      </section>

      <aside className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryEyebrow}>Run summary</span>
          <h2 className={styles.summaryTitle}>{formatJobType(jobType)} scenario</h2>
          <p className={styles.summaryText}>{describeJobType(jobType)}</p>
        </div>
        <div className={styles.summaryPillRow}>
          <span className={styles.summaryPill}>{selectedWorkloadLabel}</span>
          {jobType === 'optimize'
            ? <span className={styles.summaryPill}>Fresh search</span>
            : <span className={styles.summaryPill}>{selectedFleet?.name || 'Fleet required'}</span>}
        </div>
        <dl className={styles.summaryList}>
          <div className={styles.summaryItem}>
            <dt className={styles.summaryLabel}>Arrival rate</dt>
            <dd className={styles.summaryValue}>{lam} rps</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt className={styles.summaryLabel}>SLO target</dt>
            <dd className={styles.summaryValue}>{sloMs} ms</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt className={styles.summaryLabel}>Replay size</dt>
            <dd className={styles.summaryValue}>{formatNumber(Number(nRequests) || 0)}</dd>
          </div>
          <div className={styles.summaryItem}>
            <dt className={styles.summaryLabel}>Fleet</dt>
            <dd className={styles.summaryValue}>{jobType === 'optimize' ? 'Optimizer search' : selectedFleet?.name || 'Select a fleet'}</dd>
          </div>
          {jobType === 'optimize' ? (
            <div className={styles.summaryItem}>
              <dt className={styles.summaryLabel}>Pool mix</dt>
              <dd className={styles.summaryValue}>{`${formatGpuLabel(gpuShort)} -> ${formatGpuLabel(gpuLong)}`}</dd>
            </div>
          ) : null}
          {jobType === 'whatif' ? (
            <div className={styles.summaryItem}>
              <dt className={styles.summaryLabel}>Sweep points</dt>
              <dd className={styles.summaryValue}>{formatNumber(lambdaValues.length)}</dd>
            </div>
          ) : null}
          {workloadMode === 'trace' && selectedTrace ? (
            <div className={styles.summaryItem}>
              <dt className={styles.summaryLabel}>Trace size</dt>
              <dd className={styles.summaryValue}>{formatNumber(selectedTrace.n_requests)}</dd>
            </div>
          ) : null}
        </dl>
      </aside>
    </div>
  )
}
