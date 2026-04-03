import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";

import { useDSLStore } from "@/stores/dslStore";
import type { EditorMode } from "@/types/dsl";

import styles from "./BuilderPage.module.css";
import DslEditorPage from "./DslEditorPage";
import { BuilderDeployConfirmModal, BuilderDeployToast, BuilderDragOverlay } from "./builderPageDeployOverlays";
import { VisualMode } from "./builderPageVisualShell";
import { BuilderGuideDrawer } from "./builderPageGuideDrawer";
import { BuilderImportModal } from "./builderPageImportModal";
import { BuilderOutputPanel } from "./builderPageOutputPanel";
import { useResizableWidth } from "./builderPageResizeHooks";
import { BuilderStatusBar } from "./builderPageStatusBar";
import { BuilderToolbar } from "./builderPageToolbar";
import { useReadonly } from "@/contexts/ReadonlyContext";
import type { EntityKind, SectionState, Selection } from "./builderPageTypes";
import { useBuilderEntityActions, useBuilderImport, useBuilderAutoLoad } from "./useBuilderActions";

// ---------- Component ----------

const BuilderPage: React.FC = () => {
  const {
    dslSource,
    diagnostics,
    symbols,
    ast,
    wasmReady,
    wasmError,
    loading,
    mode,
    dirty,
    yamlOutput,
    crdOutput,
    compileError,
    initWasm,
    compile,
    validate,
    parseAST,
    format,
    reset,
    setMode,
    requestDeploy,
    executeDeploy,
    dismissDeploy,
    deploying,
    deployStep,
    deployResult,
    showDeployConfirm,
    deployPreviewCurrent,
    deployPreviewMerged,
    deployPreviewLoading,
    deployPreviewError,
  } = useDSLStore();
  const { isReadonly, isLoading: readonlyLoading } = useReadonly();

  const [selection, setSelection] = useState<Selection | null>(null);
  const [sections, setSections] = useState<SectionState>({
    models: true,
    signals: true,
    routes: true,
    plugins: true,
  });
  const [addingEntity, setAddingEntity] = useState<EntityKind | null>(null);
  const [outputPanelOpen, setOutputPanelOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const { width: guideWidth, isDragging: isGuideDragging, handleDragStart: handleGuideDragStart } =
    useResizableWidth({
      initialWidth: 420,
      minWidth: 300,
      getMaxWidth: () => 800,
      stopPropagation: true,
    });
  const { width: outputWidth, isDragging, handleDragStart } = useResizableWidth({
    initialWidth: 380,
    minWidth: 200,
    getMaxWidth: () =>
      Math.floor((contentRef.current?.offsetWidth ?? window.innerWidth) * 0.6),
  });

  const entityActions = useBuilderEntityActions(setSelection, setAddingEntity);
  const importActions = useBuilderImport();

  // Initialize WASM on mount
  useEffect(() => {
    initWasm();
  }, [initWasm]);

  // Always land on the DSL editor when entering the builder page.
  useEffect(() => {
    setMode("dsl");
  }, [setMode]);

  // Parse AST when entering visual mode or when dslSource changes in visual mode
  useEffect(() => {
    if (mode === "visual" && wasmReady && dslSource.trim()) {
      parseAST();
    }
  }, [mode, wasmReady, dslSource, parseAST]);

  const toggleSection = useCallback((key: keyof SectionState) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleModeSwitch = useCallback(
    (newMode: EditorMode) => {
      setMode(newMode);
      if (newMode === "visual" && wasmReady && dslSource.trim()) {
        parseAST();
      }
    },
    [setMode, wasmReady, dslSource, parseAST],
  );
  const deployDisabled = readonlyLoading || isReadonly;

  const handleRequestDeploy = useCallback(() => {
    if (deployDisabled) {
      return;
    }
    requestDeploy();
  }, [deployDisabled, requestDeploy]);

  useBuilderAutoLoad(
    wasmReady,
    readonlyLoading,
    dslSource,
    importActions.setLoadingFromRouter,
    importActions.setImportError,
  );

  // Diagnostic counts
  const errorCount = diagnostics.filter((d) => d.level === "error").length;
  const modelCount = ast?.models?.length ?? symbols?.models?.length ?? 0;
  const signalCount = ast?.signals?.length ?? symbols?.signals?.length ?? 0;
  const routeCount = ast?.routes?.length ?? symbols?.routes?.length ?? 0;
  const pluginCount = ast?.plugins?.length ?? symbols?.plugins?.length ?? 0;
  const isValid = errorCount === 0 && wasmReady;
  const lineCount = dslSource.split("\n").length;

  // Memoize selected entity from AST
  const selectedEntity = useMemo(() => {
    if (!selection || !ast) return null;
    switch (selection.kind) {
      case "model":
        return ast.models?.find((m) => m.name === selection.name) ?? null;
      case "signal":
        return ast.signals?.find((s) => s.name === selection.name) ?? null;
      case "route":
        return ast.routes?.find((r) => r.name === selection.name) ?? null;
      case "plugin":
        return ast.plugins?.find((p) => p.name === selection.name) ?? null;
      default:
        return null;
    }
  }, [selection, ast]);

  return (
    <div className={styles.page}>
      <BuilderToolbar
        dirty={dirty}
        mode={mode}
        wasmReady={wasmReady}
        wasmError={wasmError}
        dslSource={dslSource}
        loading={loading}
        deploying={deploying}
        deployDisabled={deployDisabled}
        deployDisabledReason={
          isReadonly
            ? "Deploy is unavailable in read-only mode"
            : readonlyLoading
              ? "Checking deploy permissions..."
              : undefined
        }
        guideOpen={guideOpen}
        outputPanelOpen={outputPanelOpen}
        onModeSwitch={handleModeSwitch}
        onImport={importActions.handleOpenImport}
        onCompile={compile}
        onRequestDeploy={handleRequestDeploy}
        onFormat={format}
        onValidate={validate}
        onToggleGuide={() => setGuideOpen(!guideOpen)}
        onToggleOutput={() => setOutputPanelOpen(!outputPanelOpen)}
        onReset={reset}
      />

      {/* Main Content — editor + output panel */}
      <div className={styles.content} ref={contentRef}>
        {/* Editor area (switches by mode) */}
        <div className={styles.editorArea}>
          {mode === "visual" && (
            <VisualMode
              ast={ast}
              dslSource={dslSource}
              diagnostics={diagnostics}
              selection={selection}
              onSelect={setSelection}
              sections={sections}
              onToggleSection={toggleSection}
              selectedEntity={selectedEntity}
              modelCount={modelCount}
              signalCount={signalCount}
              routeCount={routeCount}
              pluginCount={pluginCount}
              wasmReady={wasmReady}
              wasmError={wasmError}
              addingEntity={addingEntity}
              onSetAddingEntity={setAddingEntity}
              onDeleteEntity={entityActions.handleDeleteEntity}
              onUpdateModelFields={entityActions.handleUpdateModelFields}
              onUpdateSignalFields={entityActions.handleUpdateSignalFields}
              onUpdatePluginFields={entityActions.handleUpdatePluginFields}
              onAddModel={entityActions.handleAddModel}
              onAddSignal={entityActions.handleAddSignal}
              onAddPlugin={entityActions.handleAddPlugin}
              onUpdateRoute={entityActions.handleUpdateRoute}
              onAddRoute={entityActions.handleAddRoute}
              errorCount={errorCount}
              isValid={isValid}
              onModeSwitch={handleModeSwitch}
            />
          )}
          {mode === "dsl" && (
            <div className={styles.dslModeContainer}>
              <DslEditorPage embedded hideOutput />
            </div>
          )}
          {mode === "nl" && (
            <div className={styles.nlPlaceholder}>
              <div className={styles.nlPlaceholderIcon}>🤖</div>
              <div className={styles.nlPlaceholderTitle}>
                Natural Language Mode
              </div>
              <div>
                Describe your routing configuration in plain English and let AI
                generate DSL for you.
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                Coming soon — Phase 6
              </div>
            </div>
          )}
        </div>

        <BuilderOutputPanel
          open={outputPanelOpen}
          width={outputWidth}
          yamlOutput={yamlOutput}
          crdOutput={crdOutput}
          dslSource={dslSource}
          compileError={compileError}
          onDragStart={handleDragStart}
          onOpen={() => setOutputPanelOpen(true)}
          onClose={() => setOutputPanelOpen(false)}
        />
      </div>

      <BuilderStatusBar
        isValid={isValid}
        errorCount={errorCount}
        modelCount={modelCount}
        signalCount={signalCount}
        routeCount={routeCount}
        pluginCount={pluginCount}
        lineCount={lineCount}
        mode={mode}
      />

      {/* Hidden file input for YAML import */}
      <input
        ref={importActions.fileInputRef}
        type="file"
        accept=".yaml,.yml,.json"
        style={{ display: "none" }}
        onChange={importActions.handleImportFile}
      />

      <BuilderImportModal
        open={importActions.showImportModal}
        importUrl={importActions.importUrl}
        importText={importActions.importText}
        importError={importActions.importError}
        importUrlLoading={importActions.importUrlLoading}
        loadingFromRouter={importActions.loadingFromRouter}
        importTextareaRef={importActions.importTextareaRef}
        onClose={importActions.closeImportModal}
        onImportUrlChange={importActions.setImportUrl}
        onImportTextChange={importActions.setImportText}
        onImportUrl={importActions.handleImportUrl}
        onSelectFile={() => importActions.fileInputRef.current?.click()}
        onLoadFromRouter={importActions.handleLoadFromRouter}
        onConfirm={importActions.handleImportConfirm}
      />

      <BuilderGuideDrawer
        open={guideOpen}
        width={guideWidth}
        isDragging={isGuideDragging}
        onClose={() => setGuideOpen(false)}
        onDragStart={handleGuideDragStart}
        onInsertSnippet={(snippet) => {
          if (mode !== "dsl") setMode("dsl");
          const store = useDSLStore.getState();
          const src = store.dslSource;
          store.setDslSource(
            src ? src.trimEnd() + "\n\n" + snippet + "\n" : snippet + "\n",
          );
          setGuideOpen(false);
        }}
      />

      <BuilderDeployConfirmModal
        open={showDeployConfirm}
        loading={deployPreviewLoading}
        error={deployPreviewError}
        currentYaml={deployPreviewCurrent}
        mergedYaml={deployPreviewMerged}
        onClose={dismissDeploy}
        onConfirm={executeDeploy}
      />

      <BuilderDeployToast
        deploying={deploying}
        deployStep={deployStep}
        deployResult={deployResult}
        onDismiss={dismissDeploy}
      />

      <BuilderDragOverlay active={isDragging || isGuideDragging} />
    </div>
  );
};


export default BuilderPage;
