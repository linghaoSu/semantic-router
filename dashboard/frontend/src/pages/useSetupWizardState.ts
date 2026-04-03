import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReadonly } from "../contexts/ReadonlyContext";
import { useSetup } from "../contexts/SetupContext";
import { markOnboardingPending } from "../utils/onboarding";
import {
  activateSetupConfig,
  importRemoteSetupConfig,
  validateSetupConfig,
} from "../utils/setupApi";
import {
  buildSetupConfig,
  countConfigSignals,
  createModelDraft,
  createSetupConfigCounts,
  DEFAULT_REMOTE_SETUP_CONFIG_URL,
  getStepOneErrors,
  maskSecrets,
  type ImportedSetupConfig,
  type ModelDraft,
  type RemoteImportState,
  type SetupActivationState,
  type SetupRoutingMode,
  type SetupStep,
  type SetupValidationState,
} from "./setupWizardSupport";
import {
  addSetupModel,
  removeSetupModel,
  updateSetupModel,
} from "./setupWizardModelState";

export function useSetupWizardState() {
  const navigate = useNavigate();
  const { setupState, refreshSetupState } = useSetup();
  const { isReadonly, isLoading: readonlyLoading } = useReadonly();

  const [currentStep, setCurrentStep] = useState<SetupStep>(0);
  const [models, setModels] = useState<ModelDraft[]>([createModelDraft(1)]);
  const [defaultModelId, setDefaultModelId] = useState<string>("");
  const [routingMode, setRoutingMode] = useState<SetupRoutingMode>("scratch");
  const [remoteConfigUrl, setRemoteConfigUrl] = useState(
    DEFAULT_REMOTE_SETUP_CONFIG_URL,
  );
  const [remoteImportState, setRemoteImportState] =
    useState<RemoteImportState>("idle");
  const [remoteImportError, setRemoteImportError] = useState<string | null>(
    null,
  );
  const [importedRemoteConfig, setImportedRemoteConfig] =
    useState<ImportedSetupConfig | null>(null);
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const [validationState, setValidationState] =
    useState<SetupValidationState>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedConfig, setValidatedConfig] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [validatedCounts, setValidatedCounts] = useState(
    createSetupConfigCounts(),
  );
  const [activationState, setActivationState] =
    useState<SetupActivationState>("idle");
  const [activationError, setActivationError] = useState<string | null>(null);

  useEffect(() => {
    if (models.length === 0) {
      setDefaultModelId("");
      return;
    }

    if (
      !defaultModelId ||
      !models.some((model) => model.id === defaultModelId)
    ) {
      setDefaultModelId(models[0].id);
    }
  }, [models, defaultModelId]);

  const stepOneErrors = getStepOneErrors(models, defaultModelId);
  const hasStepOneIssues = stepOneErrors.length > 0;
  const shouldShowStepOneIssues = stepOneAttempted && hasStepOneIssues;

  const resetReviewState = () => {
    setValidationState("idle");
    setValidationError(null);
    setValidatedConfig(null);
    setValidatedCounts(createSetupConfigCounts());
    setActivationState("idle");
    setActivationError(null);
  };

  const selectRoutingMode = (mode: SetupRoutingMode) => {
    setRoutingMode(mode);
    setRemoteImportError(null);
    resetReviewState();
  };

  const changeRemoteConfigUrl = (value: string) => {
    setRemoteConfigUrl(value);
    setRemoteImportError(null);
    if (
      importedRemoteConfig &&
      value.trim() !== importedRemoteConfig.sourceUrl
    ) {
      setImportedRemoteConfig(null);
      setRemoteImportState("idle");
      resetReviewState();
      return;
    }
    if (remoteImportState === "error") {
      setRemoteImportState("idle");
    }
  };

  let scratchConfig: Record<string, unknown> | null = null;
  let scratchBuildError: string | null = null;
  if (stepOneErrors.length === 0) {
    try {
      scratchConfig = buildSetupConfig(models, defaultModelId);
    } catch (err) {
      scratchBuildError =
        err instanceof Error ? err.message : "Failed to build setup config.";
    }
  }

  const scratchCounts = createSetupConfigCounts({
    models: models.length,
    decisions: Array.isArray(scratchConfig?.decisions)
      ? scratchConfig.decisions.length
      : 0,
    signals: countConfigSignals(scratchConfig?.signals),
    canActivate:
      models.length > 0 &&
      Array.isArray(scratchConfig?.decisions) &&
      scratchConfig.decisions.length > 0,
  });

  const currentRouteLabel =
    routingMode === "remote" ? "From remote" : "From scratch";
  const draftConfig =
    routingMode === "remote"
      ? (importedRemoteConfig?.config ?? null)
      : scratchConfig;
  const generatedCounts =
    routingMode === "remote"
      ? (importedRemoteConfig?.counts ?? createSetupConfigCounts())
      : scratchCounts;

  const previewSource = maskSecrets(validatedConfig ?? draftConfig);
  const validationSignature = draftConfig ? JSON.stringify(draftConfig) : "";

  useEffect(() => {
    if (currentStep !== 2 || !validationSignature) {
      return;
    }

    let cancelled = false;
    // Scratch configs are rebuilt on every render, so key auto-validation off a
    // stable serialized payload instead of object identity.
    const validationPayload = JSON.parse(validationSignature) as Record<
      string,
      unknown
    >;

    const runValidation = async () => {
      setValidationState("validating");
      setValidationError(null);
      setActivationError(null);

      try {
        const result = await validateSetupConfig(validationPayload);
        if (cancelled) {
          return;
        }

        setValidatedConfig(result.config ?? validationPayload);
        setValidatedCounts({
          models: result.models,
          decisions: result.decisions,
          signals: result.signals,
          canActivate: result.canActivate,
        });
        setValidationState(result.valid ? "valid" : "error");
      } catch (err) {
        if (cancelled) {
          return;
        }

        setValidatedConfig(null);
        setValidatedCounts(createSetupConfigCounts());
        setValidationState("error");
        setValidationError(
          err instanceof Error ? err.message : "Setup validation failed.",
        );
      }
    };

    void runValidation();

    return () => {
      cancelled = true;
    };
  }, [currentStep, validationSignature]);

  const addModel = () => {
    setModels(addSetupModel);
    resetReviewState();
  };

  const updateModel = (id: string, field: keyof ModelDraft, value: string) => {
    setModels((prev) => updateSetupModel(prev, id, field, value));
    resetReviewState();
  };

  const removeModel = (id: string) => {
    setModels((prev) => removeSetupModel(prev, id));
    resetReviewState();
  };

  const goToStep = (step: SetupStep) => {
    if (step > 0 && (hasStepOneIssues || scratchBuildError)) {
      setStepOneAttempted(true);
      return;
    }

    if (step === 2 && routingMode === "remote" && !importedRemoteConfig) {
      setRemoteImportError("Import a remote config before continuing.");
      return;
    }

    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (hasStepOneIssues || scratchBuildError) {
        setStepOneAttempted(true);
        return;
      }

      setCurrentStep(1);
      return;
    }

    if (
      currentStep === 1 &&
      routingMode === "remote" &&
      !importedRemoteConfig
    ) {
      setRemoteImportError("Import a remote config before continuing.");
      return;
    }

    setCurrentStep((prev) => (prev === 2 ? prev : ((prev + 1) as SetupStep)));
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev === 0 ? prev : ((prev - 1) as SetupStep)));
  };

  const handleValidateAgain = async () => {
    if (!draftConfig) {
      return;
    }

    setValidationState("validating");
    setValidationError(null);

    try {
      const result = await validateSetupConfig(draftConfig);
      setValidatedConfig(result.config ?? draftConfig);
      setValidatedCounts({
        models: result.models,
        decisions: result.decisions,
        signals: result.signals,
        canActivate: result.canActivate,
      });
      setValidationState(result.valid ? "valid" : "error");
    } catch (err) {
      setValidatedConfig(null);
      setValidatedCounts(createSetupConfigCounts());
      setValidationState("error");
      setValidationError(
        err instanceof Error ? err.message : "Setup validation failed.",
      );
    }
  };

  const handleImportRemote = async () => {
    const trimmedUrl = remoteConfigUrl.trim();
    if (!trimmedUrl) {
      setRemoteImportState("error");
      setRemoteImportError("Paste a remote config URL before importing.");
      return;
    }

    setRemoteImportState("importing");
    setRemoteImportError(null);
    resetReviewState();

    try {
      const result = await importRemoteSetupConfig(trimmedUrl);
      setImportedRemoteConfig({
        config: result.config,
        sourceUrl: result.sourceUrl,
        counts: createSetupConfigCounts({
          models: result.models,
          decisions: result.decisions,
          signals: result.signals,
          canActivate: result.canActivate,
        }),
      });
      setRemoteConfigUrl(result.sourceUrl);
      setRemoteImportState("imported");
    } catch (err) {
      setImportedRemoteConfig(null);
      setRemoteImportState("error");
      setRemoteImportError(
        err instanceof Error ? err.message : "Remote import failed.",
      );
    }
  };

  const handleActivate = async () => {
    if (!draftConfig || validationState !== "valid") {
      return;
    }

    setActivationState("activating");
    setActivationError(null);

    try {
      const payload = validatedConfig ?? draftConfig;
      await activateSetupConfig(payload);
      markOnboardingPending();
      await refreshSetupState();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setActivationState("error");
      setActivationError(
        err instanceof Error ? err.message : "Setup activation failed.",
      );
    }
  };

  return {
    // Context state
    setupState,
    isReadonly,
    readonlyLoading,

    // Wizard step state
    currentStep,
    goToStep,
    handleNext,
    handleBack,

    // Model state
    models,
    defaultModelId,
    setDefaultModelId,
    addModel,
    updateModel,
    removeModel,

    // Step one validation
    stepOneErrors,
    shouldShowStepOneIssues,
    stepOneAttempted,
    scratchBuildError,

    // Routing state
    routingMode,
    remoteConfigUrl,
    remoteImportState,
    remoteImportError,
    importedRemoteConfig,
    selectRoutingMode,
    changeRemoteConfigUrl,
    handleImportRemote,

    // Derived draft state
    currentRouteLabel,
    generatedCounts,
    previewSource,

    // Validation & activation
    validationState,
    validationError,
    validatedCounts,
    activationState,
    activationError,
    handleValidateAgain,
    handleActivate,
  };
}
