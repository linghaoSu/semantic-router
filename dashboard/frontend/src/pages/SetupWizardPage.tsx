import React from "react";
import ColorBends from "../components/ColorBends";
import {
  ModelStepPanel,
  RoutingStarterPanel,
  SetupWizardStepper,
} from "./SetupWizardPanels";
import { ReviewActivatePanel } from "./SetupWizardReviewPanel";
import { useSetupWizardState } from "./useSetupWizardState";
import styles from "./SetupWizardPage.module.css";

const SetupWizardPage: React.FC = () => {
  const state = useSetupWizardState();

  return (
    <div className={styles.page}>
      <div className={styles.backgroundEffect}>
        <ColorBends
          colors={["#76b900", "#00b4d8", "#ffffff"]}
          rotation={20}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.08}
          transparent
          autoRotate={0.8}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.heroHeader}>
            <div className={styles.heroBadge}>First-run setup</div>
          </div>
          <div className={styles.heroTitleRow}>
            <div className={styles.heroLogoWrap} aria-hidden="true">
              <img className={styles.heroLogo} src="/vllm.png" alt="" />
            </div>
            <h1 className={styles.heroTitle}>
              Configure a model first. Routing can follow.
            </h1>
          </div>
          <p className={styles.heroDescription}>
            Extract signals. Compose decisions. Route the best model.
          </p>
        </div>

        <SetupWizardStepper currentStep={state.currentStep} onGoToStep={state.goToStep} />

        <div className={styles.panel}>
          {state.currentStep === 0 && (
            <ModelStepPanel
              currentRouteLabel={state.currentRouteLabel}
              models={state.models}
              defaultModelId={state.defaultModelId}
              shouldShowStepOneIssues={state.shouldShowStepOneIssues}
              stepOneErrors={state.stepOneErrors}
              stepOneAttempted={state.stepOneAttempted}
              draftBuildError={state.scratchBuildError}
              onAddModel={state.addModel}
              onUpdateModel={state.updateModel}
              onRemoveModel={state.removeModel}
              onSelectDefaultModel={state.setDefaultModelId}
            />
          )}
          {state.currentStep === 1 && (
            <RoutingStarterPanel
              currentRouteLabel={state.currentRouteLabel}
              routingMode={state.routingMode}
              remoteConfigUrl={state.remoteConfigUrl}
              remoteImportState={state.remoteImportState}
              remoteImportError={state.remoteImportError}
              importedConfig={state.importedRemoteConfig}
              counts={state.generatedCounts}
              onSelectRoutingMode={state.selectRoutingMode}
              onChangeRemoteConfigUrl={state.changeRemoteConfigUrl}
              onImportRemoteConfig={() => void state.handleImportRemote()}
            />
          )}
          {state.currentStep === 2 && (
            <ReviewActivatePanel
              currentRouteLabel={state.currentRouteLabel}
              listenerPort={state.setupState?.listenerPort}
              validationState={state.validationState}
              validationError={state.validationError}
              activationError={state.activationError}
              validatedCounts={state.validatedCounts}
              modelsCount={state.generatedCounts.models}
              generatedDecisions={state.generatedCounts.decisions}
              generatedSignals={state.generatedCounts.signals}
              previewSource={state.previewSource}
              readonlyLoading={state.readonlyLoading}
              isReadonly={state.isReadonly}
              onValidateAgain={() => void state.handleValidateAgain()}
            />
          )}

          <div className={styles.footer}>
            <div className={styles.footerActions}>
              {state.currentStep > 0 && (
                <button className={styles.secondaryButton} onClick={state.handleBack}>
                  Back
                </button>
              )}
              {state.currentStep < 2 && (
                <button className={styles.primaryButton} onClick={state.handleNext}>
                  Next
                </button>
              )}
              {state.currentStep === 2 && (
                <button
                  className={styles.primaryButton}
                  onClick={() => void state.handleActivate()}
                  disabled={
                    state.validationState !== "valid" ||
                    !state.validatedCounts.canActivate ||
                    state.activationState === "activating" ||
                    (!state.readonlyLoading && state.isReadonly)
                  }
                >
                  {state.activationState === "activating"
                    ? "Activating…"
                    : "Activate"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizardPage;
