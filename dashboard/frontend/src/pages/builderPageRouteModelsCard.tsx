import type { RouteModelInput } from "@/lib/dslMutations";

import styles from "./BuilderPage.module.css";
import { CustomSelect } from "./builderPageFormPrimitives";
import { ModelNameInput } from "./builderPageRouteSharedControls";

interface BuilderPageRouteModelsCardProps {
  addLabel: string;
  allowRemoveSingle: boolean;
  availableModels: string[];
  emptyMessage?: string;
  models: RouteModelInput[];
  showWeightAndParamSize: boolean;
  onAddModel: () => void;
  onRemoveModel: (index: number) => void;
  onUpdateModel: (index: number, patch: Partial<RouteModelInput>) => void;
}

export default function BuilderPageRouteModelsCard({
  addLabel,
  allowRemoveSingle,
  availableModels,
  emptyMessage,
  models,
  showWeightAndParamSize,
  onAddModel,
  onRemoveModel,
  onUpdateModel,
}: BuilderPageRouteModelsCardProps) {
  return (
    <div className={styles.dslPreview}>
      <div className={styles.dslPreviewHeader}>
        <span className={styles.dslPreviewTitle}>
          Models ({models.length})
        </span>
        <button
          className={styles.toolbarBtn}
          onClick={onAddModel}
          style={{ padding: "0.25rem 0.5rem", fontSize: "var(--text-xs)" }}
        >
          {addLabel}
        </button>
      </div>
      <div
        style={{
          padding: "var(--spacing-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        {emptyMessage && models.length === 0 ? (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {emptyMessage}
          </span>
        ) : null}
        {models.map((model, index) => (
          <div key={index} className={styles.modelCard}>
            <div className={styles.modelCardHeader}>
              <span className={styles.modelIndex}>{index + 1}</span>
              <ModelNameInput
                value={model.model}
                availableModels={availableModels}
                onChange={(value) => onUpdateModel(index, { model: value })}
              />
              {allowRemoveSingle || models.length > 1 ? (
                <button
                  className={styles.toolbarBtnDanger}
                  onClick={() => onRemoveModel(index)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "var(--text-xs)",
                    flexShrink: 0,
                  }}
                  title="Remove model"
                >
                  ×
                </button>
              ) : null}
            </div>
            <div className={styles.modelAttrs}>
              <label className={styles.modelAttrCheck}>
                <input
                  type="checkbox"
                  checked={model.reasoning ?? false}
                  onChange={(event) =>
                    onUpdateModel(index, {
                      reasoning: event.target.checked || undefined,
                    })
                  }
                  style={{ accentColor: "var(--color-primary)" }}
                />
                reasoning
              </label>
              <div className={styles.modelAttrField}>
                <span className={styles.modelAttrLabel}>effort:</span>
                <div style={{ minWidth: "90px" }}>
                  <CustomSelect
                    value={model.effort ?? ""}
                    options={["", "low", "medium", "high"]}
                    onChange={(value) =>
                      onUpdateModel(index, { effort: value || undefined })
                    }
                    placeholder="—"
                  />
                </div>
              </div>
              {showWeightAndParamSize ? (
                <>
                  <div className={styles.modelAttrField}>
                    <span className={styles.modelAttrLabel}>weight:</span>
                    <input
                      className={styles.fieldInput}
                      style={{
                        width: "60px",
                        fontSize: "var(--text-xs)",
                        padding: "0.25rem 0.5rem",
                      }}
                      type="number"
                      step="any"
                      value={model.weight !== undefined ? model.weight : ""}
                      onChange={(event) =>
                        onUpdateModel(index, {
                          weight: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      placeholder="—"
                    />
                  </div>
                  <div className={styles.modelAttrField}>
                    <span className={styles.modelAttrLabel}>param_size:</span>
                    <input
                      className={styles.fieldInput}
                      style={{
                        width: "70px",
                        fontSize: "var(--text-xs)",
                        padding: "0.25rem 0.5rem",
                      }}
                      value={model.paramSize ?? ""}
                      onChange={(event) =>
                        onUpdateModel(index, {
                          paramSize: event.target.value || undefined,
                        })
                      }
                      placeholder="—"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
