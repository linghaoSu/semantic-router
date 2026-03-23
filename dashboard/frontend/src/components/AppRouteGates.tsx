import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSetup } from '../contexts/SetupContext'
import OnboardingGuide from './OnboardingGuide'
import SetupStatusPage from './SetupStatusPage'

export const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <SetupStatusPage
        title="Authenticating"
        description="Checking session state..."
        actionLabel="Retry"
        onAction={() => {
          window.location.reload()
        }}
      />
    )
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }

  return <Outlet />
}

export const AuthenticatedShell: React.FC = () => {
  const { setupState } = useSetup()
  const location = useLocation()
  const isSetupMode = setupState?.setupMode ?? false

  if (isSetupMode && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }

  if (!isSetupMode && location.pathname === '/setup') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <Outlet />
      {!isSetupMode && location.pathname !== '/setup' && <OnboardingGuide />}
    </>
  )
}
