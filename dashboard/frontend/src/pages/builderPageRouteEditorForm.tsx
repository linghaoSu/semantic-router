import React, { useCallback, useEffect, useMemo, useState } from "react";

import ExpressionBuilder from "@/components/ExpressionBuilder";
import { useDSLStore } from "@/stores/dslStore";
import type { ASTRouteDecl, DSLFieldObject } from "@/types/dsl";
import {
  ALGORITHM_DESCRIPTIONS,
  ALGORITHM_TYPES,
  serializeBoolExpr,
} from "@/lib/dslMutations";
import type {
  RouteAlgoInput,
  RouteInput,
  RouteModelInput,
  RoutePluginInput,
} from "@/lib/dslMutations";

import styles from "./BuilderPage.module.css";
import { CustomSelect } from "./builderPageFormPrimitives";
import { AlgorithmSchemaEditor } from "./builderPageEntityForms";
import BuilderPageRouteModelsCard from "./builderPageRouteModelsCard";
import BuilderPageRoutePluginsCard from "./builderPageRoutePluginsCard";
import {
  astAlgoToInput,
  astModelToInput,
  astPluginRefToInput,
  generateRouteDslPreview,
  validateRouteInput,
} from "./builderPageRouteSupport";
import {
  RouteDslPreviewPanel,
} from "./builderPageRoutePreview";
import type { AvailablePlugin, AvailableSignal } from "./builderPageTypes";

const RouteEditorForm: React.FC<{
  route: ASTRouteDecl;
  onUpdate: (input: RouteInput) => void;
  availableSignals: AvailableSignal[];
  availablePlugins: AvailablePlugin[];
  availableModels: string[];
}> = ({
  route,
  onUpdate,
  availableSignals,
  availablePlugins,
  availableModels,
}) => {
  const [description, setDescription] = useState(route.description ?? "");
  const [priority, setPriority] = useState(route.priority);
  const [whenExpr, setWhenExpr] = useState(() =>
    serializeBoolExpr(route.when),
  );
  const [models, setModels] = useState<RouteModelInput[]>(() =>
    route.models.map(astModelToInput),
  );
  const [algorithm, setAlgorithm] = useState<RouteAlgoInput | undefined>(() =>
    astAlgoToInput(route.algorithm),
  );
  const [plugins, setPlugins] = useState<RoutePluginInput[]>(() =>
    route.plugins.map(astPluginRefToInput),
  );

  // Sync from parent when route changes
  useEffect(() => {
    setDescription(route.description ?? "");
    setPriority(route.priority);
    setWhenExpr(
      serializeBoolExpr(route.when),
    );
    setModels(route.models.map(astModelToInput));
    setAlgorithm(astAlgoToInput(route.algorithm));
    setPlugins(route.plugins.map(astPluginRefToInput));
  }, [
    route.name,
    route.priority,
    route.description,
    route.when,
    route.models,
    route.algorithm,
    route.plugins,
  ]);

  const handleSave = useCallback(() => {
    onUpdate({
      description: description.trim() || undefined,
      priority,
      when: whenExpr.trim() || undefined,
      models,
      algorithm: algorithm?.algoType ? algorithm : undefined,
      plugins,
    });
  }, [description, priority, whenExpr, models, algorithm, plugins, onUpdate]);

  // Model helpers
  const addModel = useCallback(() => {
    setModels((prev) => [...prev, { model: "" }]);
  }, []);

  const removeModel = useCallback((idx: number) => {
    setModels((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateModel = useCallback(
    (idx: number, patch: Partial<RouteModelInput>) => {
      setModels((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  // Plugin toggle helpers
  const activePluginNames = useMemo(
    () => new Set(plugins.map((p) => p.name)),
    [plugins],
  );

  const togglePlugin = useCallback((pluginName: string) => {
    setPlugins((prev) => {
      const exists = prev.find((p) => p.name === pluginName);
      if (exists) return prev.filter((p) => p.name !== pluginName);
      return [...prev, { name: pluginName }];
    });
  }, []);

  const updatePluginFields = useCallback(
    (pluginName: string, fields: DSLFieldObject) => {
      setPlugins((prev) =>
        prev.map((p) => (p.name === pluginName ? { ...p, fields } : p)),
      );
    },
    [],
  );

  // Expression builder: tree-based, managed by ExpressionBuilder component

  // Generate DSL preview & validation
  const dslPreview = useMemo(
    () =>
      generateRouteDslPreview(
        route.name,
        description,
        priority,
        whenExpr,
        models,
        algorithm,
        plugins,
      ),
    [route.name, description, priority, whenExpr, models, algorithm, plugins],
  );

  const validationIssues = useMemo(
    () => validateRouteInput(route.name, models, algorithm, plugins),
    [route.name, models, algorithm, plugins],
  );

  // Get WASM diagnostics scoped to this route
  const diagnostics = useDSLStore((s) => s.diagnostics);
  const routeDiagnostics = useMemo(() => {
    if (!route.pos?.Line) return [];
    const startLine = route.pos.Line;
    return diagnostics
      .filter((d) => d.line >= startLine && d.line <= startLine + 50)
      .map((d) => ({ level: d.level, message: d.message }));
  }, [diagnostics, route.pos]);

  return (
    <>
      {/* Header with Save */}
      <div className={styles.dslPreview}>
        <div className={styles.dslPreviewHeader}>
          <span className={styles.dslPreviewTitle}>Route Configuration</span>
          <button
            className={styles.toolbarBtnPrimary}
            onClick={handleSave}
            style={{ padding: "0.25rem 0.5rem", fontSize: "var(--text-xs)" }}
          >
            Save
          </button>
        </div>
        <div
          style={{
            padding: "var(--spacing-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "var(--spacing-md)",
            }}
          >
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Description</label>
              <input
                className={styles.fieldInput}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Route description..."
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Priority <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className={styles.fieldInput}
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                style={{ width: "100px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* WHEN Expression Builder */}
      <div className={styles.dslPreview}>
        <div className={styles.dslPreviewHeader}>
          <span className={styles.dslPreviewTitle}>
            WHEN (Expression Builder)
          </span>
        </div>
        <div
          style={{
            padding: "var(--spacing-md)",
            minHeight: "350px",
            maxHeight: "50vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ExpressionBuilder
            value={whenExpr}
            onChange={setWhenExpr}
            initialAstExpr={
              route.when
            }
            availableSignals={availableSignals}
          />
        </div>
      </div>

      <BuilderPageRouteModelsCard
        addLabel="+ Add Model"
        allowRemoveSingle
        availableModels={availableModels}
        emptyMessage="No models configured. Add at least one model."
        models={models}
        showWeightAndParamSize
        onAddModel={addModel}
        onRemoveModel={removeModel}
        onUpdateModel={updateModel}
      />

      {/* Algorithm */}
      <div className={styles.dslPreview}>
        <div className={styles.dslPreviewHeader}>
          <span className={styles.dslPreviewTitle}>
            Algorithm {models.length >= 2 ? "" : "(optional — for multi-model)"}
          </span>
          {!algorithm && (
            <button
              className={styles.toolbarBtn}
              onClick={() =>
                setAlgorithm({ algoType: "confidence", fields: {} })
              }
              style={{ padding: "0.25rem 0.5rem", fontSize: "var(--text-xs)" }}
            >
              + Add
            </button>
          )}
          {algorithm && (
            <button
              className={styles.toolbarBtnDanger}
              onClick={() => setAlgorithm(undefined)}
              style={{ padding: "0.25rem 0.5rem", fontSize: "var(--text-xs)" }}
            >
              Remove
            </button>
          )}
        </div>
        {algorithm && (
          <div
            style={{
              padding: "var(--spacing-md)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Algorithm Type</label>
              <CustomSelect
                value={algorithm.algoType}
                options={[...ALGORITHM_TYPES]}
                onChange={(v) => setAlgorithm({ algoType: v, fields: {} })}
              />
              {ALGORITHM_DESCRIPTIONS[algorithm.algoType] && (
                <span
                  style={{
                    fontSize: "0.625rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {ALGORITHM_DESCRIPTIONS[algorithm.algoType]}
                </span>
              )}
            </div>
            <AlgorithmSchemaEditor
              algoType={algorithm.algoType}
              fields={algorithm.fields}
              onUpdate={(f) => setAlgorithm({ ...algorithm, fields: f })}
            />
          </div>
        )}
        {!algorithm && (
          <div
            style={{
              padding: "var(--spacing-md)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            No algorithm configured.{" "}
            {models.length >= 2
              ? "Recommended when using multiple models."
              : ""}
          </div>
        )}
      </div>

      <BuilderPageRoutePluginsCard
        activePluginNames={activePluginNames}
        availablePlugins={availablePlugins}
        emptyMessage="No plugins defined. Create plugins first."
        plugins={plugins}
        showPluginType
        onAddManualPlugin={(name) =>
          setPlugins((prev) => [...prev, { name }])
        }
        onTogglePlugin={togglePlugin}
        onUpdatePluginFields={updatePluginFields}
      />

      {/* DSL Preview with validation */}
      <RouteDslPreviewPanel
        dslText={dslPreview}
        issues={validationIssues}
        wasmDiagnostics={routeDiagnostics}
      />
    </>
  );
};

export { RouteEditorForm };
