import React from "react";
import { Navigate, Route } from "react-router-dom";
import Layout from "./components/Layout";
import BuilderPage from "./pages/BuilderPage";
import ConfigSectionRoute from "./pages/ConfigSectionRoute";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import FleetSimFleetsPage from "./pages/FleetSimFleetsPage";
import FleetSimOverviewPage from "./pages/FleetSimOverviewPage";
import FleetSimRunsPage from "./pages/FleetSimRunsPage";
import FleetSimWorkloadsPage from "./pages/FleetSimWorkloadsPage";
import InsightsPage from "./pages/InsightsPage";
import LogsPage from "./pages/LogsPage";
import MLSetupPage from "./pages/MLSetupPage";
import MonitoringPage from "./pages/MonitoringPage";
import OpenClawPage from "./pages/OpenClawPage";
import PlaygroundFullscreenPage from "./pages/PlaygroundFullscreenPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import RatingsPage from "./pages/RatingsPage";
import SetupWizardPage from "./pages/SetupWizardPage";
import StatusPage from "./pages/StatusPage";
import TopologyPage from "./pages/TopologyPage";
import TracingPage from "./pages/TracingPage";
import UsersPage from "./pages/UsersPage";

interface LayoutOptions {
  hideHeaderOnMobile?: boolean;
  hideAccountControl?: boolean;
}

interface LayoutRouteDefinition {
  path: string;
  page: React.ReactNode;
  layoutProps?: LayoutOptions;
}

function renderLayoutPage(page: React.ReactNode, layoutProps?: LayoutOptions) {
  return <Layout {...layoutProps}>{page}</Layout>;
}

const LAYOUT_ROUTES: ReadonlyArray<LayoutRouteDefinition> = [
  { path: "/dashboard", page: <DashboardPage /> },
  { path: "/monitoring", page: <MonitoringPage /> },
  {
    path: "/playground",
    page: <PlaygroundPage />,
    layoutProps: {
      hideHeaderOnMobile: true,
      hideAccountControl: true,
    },
  },
  { path: "/topology", page: <TopologyPage /> },
  { path: "/tracing", page: <TracingPage /> },
  { path: "/status", page: <StatusPage /> },
  { path: "/logs", page: <LogsPage /> },
  { path: "/insights", page: <InsightsPage /> },
  { path: "/evaluation", page: <EvaluationPage /> },
  { path: "/ratings", page: <RatingsPage /> },
  { path: "/fleet-sim", page: <FleetSimOverviewPage /> },
  { path: "/fleet-sim/workloads", page: <FleetSimWorkloadsPage /> },
  { path: "/fleet-sim/fleets", page: <FleetSimFleetsPage /> },
  { path: "/fleet-sim/runs", page: <FleetSimRunsPage /> },
  { path: "/builder", page: <BuilderPage /> },
  { path: "/clawos", page: <OpenClawPage /> },
  { path: "/users", page: <UsersPage /> },
];

interface AuthenticatedRoutesOptions {
  canUseMLSetup: boolean;
  setupMode: boolean;
}

export function renderAuthenticatedRoutes({
  canUseMLSetup,
  setupMode,
}: AuthenticatedRoutesOptions) {
  return (
    <>
      <Route path="/setup" element={<SetupWizardPage />} />
      {LAYOUT_ROUTES.map(({ path, page, layoutProps }) => (
        <Route
          key={path}
          path={path}
          element={renderLayoutPage(page, layoutProps)}
        />
      ))}
      <Route path="/config" element={<ConfigSectionRoute />} />
      <Route path="/config/:section" element={<ConfigSectionRoute />} />
      <Route
        path="/ml-setup"
        element={
          canUseMLSetup ? (
            renderLayoutPage(<MLSetupPage />)
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/playground/fullscreen"
        element={<PlaygroundFullscreenPage />}
      />
      <Route path="/openclaw" element={<Navigate to="/clawos" replace />} />
      <Route
        path="*"
        element={<Navigate to={setupMode ? "/setup" : "/dashboard"} replace />}
      />
    </>
  );
}
