import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthGate, AuthenticatedShell } from './components/AppRouteGates'
import SetupStatusPage from './components/SetupStatusPage'
import LandingPage from './pages/LandingPage'
import MonitoringPage from './pages/MonitoringPage'
import PlaygroundPage from './pages/PlaygroundPage'
import PlaygroundFullscreenPage from './pages/PlaygroundFullscreenPage'
import TopologyPage from './pages/TopologyPage'
import TracingPage from './pages/TracingPage'
import StatusPage from './pages/StatusPage'
import LogsPage from './pages/LogsPage'
import EvaluationPage from './pages/EvaluationPage'
import MLSetupPage from './pages/MLSetupPage'
import RatingsPage from './pages/RatingsPage'
import BuilderPage from './pages/BuilderPage'
import DashboardPage from './pages/DashboardPage'
import FleetSimOverviewPage from './pages/FleetSimOverviewPage'
import FleetSimWorkloadsPage from './pages/FleetSimWorkloadsPage'
import FleetSimFleetsPage from './pages/FleetSimFleetsPage'
import FleetSimRunsPage from './pages/FleetSimRunsPage'
import OpenClawPage from './pages/OpenClawPage'
import UsersPage from './pages/UsersPage'
import InsightsPage from './pages/InsightsPage'
import { ConfigSection } from './components/ConfigNav'
import { ReadonlyProvider } from './contexts/ReadonlyContext'
import { SetupProvider, useSetup } from './contexts/SetupContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SetupWizardPage from './pages/SetupWizardPage'
import ConfigSectionRoute from './pages/ConfigSectionRoute'
import LoginPage from './pages/LoginPage'
import AuthTransitionPage from './pages/AuthTransitionPage'
import { canAccessMLSetup } from './utils/accessControl'

const AppRouter: React.FC = () => {
  const { setupState, isLoading, error, refreshSetupState } = useSetup()
  const { user } = useAuth()
  const [configSection, setConfigSection] = useState<ConfigSection>('global-config')
  const canUseMLSetup = canAccessMLSetup(user)

  const withLayout = (
    page: React.ReactNode,
    layoutProps?: { hideHeaderOnMobile?: boolean; hideAccountControl?: boolean }
  ) => (
    <Layout
      configSection={configSection}
      onConfigSectionChange={(section) => setConfigSection(section as ConfigSection)}
      {...layoutProps}
    >
      {page}
    </Layout>
  )

  if (isLoading) {
    return (
      <SetupStatusPage
        title="Loading setup state"
        description="The dashboard is checking whether this workspace is already activated or still in first-run setup mode."
        actionLabel="Refresh"
        onAction={() => {
          window.location.reload()
        }}
      />
    )
  }

  if (error) {
    return (
      <SetupStatusPage
        title="Unable to load setup state"
        description={error}
        actionLabel="Retry"
        onAction={() => {
          void refreshSetupState()
        }}
      />
    )
  }

  const setupMode = setupState?.setupMode ?? false

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/transition" element={<AuthTransitionPage />} />

        <Route element={<AuthGate />}>
          <Route element={<AuthenticatedShell />}>
            <Route path="/setup" element={<SetupWizardPage />} />
            <Route path="/dashboard" element={withLayout(<DashboardPage />)} />
            <Route path="/monitoring" element={withLayout(<MonitoringPage />)} />
            <Route
              path="/config"
              element={
                <ConfigSectionRoute
                  configSection={configSection}
                  setConfigSection={setConfigSection}
                />
              }
            />
            <Route
              path="/config/:section"
              element={
                <ConfigSectionRoute
                  configSection={configSection}
                  setConfigSection={setConfigSection}
                />
              }
            />
            <Route
              path="/playground"
              element={withLayout(<PlaygroundPage />, { hideHeaderOnMobile: true, hideAccountControl: true })}
            />
            <Route path="/playground/fullscreen" element={<PlaygroundFullscreenPage />} />
            <Route path="/topology" element={withLayout(<TopologyPage />)} />
            <Route path="/tracing" element={withLayout(<TracingPage />)} />
            <Route path="/status" element={withLayout(<StatusPage />)} />
            <Route path="/logs" element={withLayout(<LogsPage />)} />
            <Route path="/insights" element={withLayout(<InsightsPage />)} />
            <Route path="/evaluation" element={withLayout(<EvaluationPage />)} />
            <Route
              path="/ml-setup"
              element={
                canUseMLSetup ? withLayout(<MLSetupPage />) : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="/ratings" element={withLayout(<RatingsPage />)} />
            <Route path="/fleet-sim" element={withLayout(<FleetSimOverviewPage />)} />
            <Route path="/fleet-sim/workloads" element={withLayout(<FleetSimWorkloadsPage />)} />
            <Route path="/fleet-sim/fleets" element={withLayout(<FleetSimFleetsPage />)} />
            <Route path="/fleet-sim/runs" element={withLayout(<FleetSimRunsPage />)} />
            <Route path="/builder" element={withLayout(<BuilderPage />)} />
            <Route path="/clawos" element={withLayout(<OpenClawPage />)} />
            <Route path="/users" element={withLayout(<UsersPage />)} />
            <Route path="/openclaw" element={<Navigate to="/clawos" replace />} />
            <Route path="*" element={<Navigate to={setupMode ? '/setup' : '/dashboard'} replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const App: React.FC = () => {
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    // Detect if we're running inside an iframe (potential loop)
    if (window.self !== window.top) {
      setIsInIframe(true)
      console.warn('Dashboard detected it is running inside an iframe - this may indicate a loop')
    }
  }, [])

  // If we're in an iframe, show a warning instead of rendering the full app
  if (isInIframe) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-danger)' }}>
          Nested Dashboard Detected
        </h1>
        <p style={{ maxWidth: '600px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          The dashboard has detected that it is running inside an iframe. This usually indicates a
          configuration error where the dashboard is trying to embed itself.
        </p>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
          Please check your Grafana dashboard path and backend proxy configuration.
        </p>
        <button
          onClick={() => {
            window.top?.location.reload()
          }}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Open Dashboard in New Tab
        </button>
      </div>
    )
  }

  return (
    <AuthProvider>
      <ReadonlyProvider>
        <SetupProvider>
          <AppRouter />
        </SetupProvider>
      </ReadonlyProvider>
    </AuthProvider>
  )
}

export default App
