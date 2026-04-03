import React, { useMemo } from "react";

import styles from "./BuilderPage.module.css";
import type { ValidationIssue } from "./builderPageRouteSupport";

// ===================================================================
// Route DSL Preview with validation badges
// ===================================================================

const ISSUE_ICONS: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  constraint: "ℹ",
};

const ISSUE_COLORS: Record<string, string> = {
  error: "#ff5555",
  warning: "#f1c40f",
  constraint: "#5dade2",
};

const RouteDslPreviewPanel: React.FC<{
  dslText: string;
  issues: ValidationIssue[];
  /** Diagnostics from WASM for this route (line-matched) */
  wasmDiagnostics?: { level: string; message: string }[];
}> = ({ dslText, issues, wasmDiagnostics = [] }) => {
  const allIssues = useMemo(() => {
    const merged: ValidationIssue[] = [...issues];
    wasmDiagnostics.forEach((d) => {
      merged.push({
        level: d.level as ValidationIssue["level"],
        message: d.message,
      });
    });
    return merged;
  }, [issues, wasmDiagnostics]);

  const errorCount = allIssues.filter((i) => i.level === "error").length;
  const warnCount = allIssues.filter((i) => i.level === "warning").length;
  const constraintCount = allIssues.filter(
    (i) => i.level === "constraint",
  ).length;

  return (
    <div className={styles.dslPreview}>
      <div className={styles.dslPreviewHeader}>
        <span className={styles.dslPreviewTitle}>
          DSL Preview
          {allIssues.length > 0 && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.625rem",
                fontWeight: 400,
              }}
            >
              {errorCount > 0 && (
                <span
                  style={{ color: ISSUE_COLORS.error, marginRight: "0.5rem" }}
                >
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warnCount > 0 && (
                <span
                  style={{ color: ISSUE_COLORS.warning, marginRight: "0.5rem" }}
                >
                  {warnCount} warning{warnCount > 1 ? "s" : ""}
                </span>
              )}
              {constraintCount > 0 && (
                <span style={{ color: ISSUE_COLORS.constraint }}>
                  {constraintCount} hint{constraintCount > 1 ? "s" : ""}
                </span>
              )}
            </span>
          )}
        </span>
      </div>
      <pre className={styles.dslPreviewCode}>{dslText}</pre>
      {allIssues.length > 0 && (
        <div
          style={{
            padding: "0.5rem var(--spacing-md)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {allIssues.map((issue, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                fontSize: "0.6875rem",
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  color: ISSUE_COLORS[issue.level],
                  fontWeight: 700,
                  flexShrink: 0,
                  width: "1rem",
                  textAlign: "center",
                }}
              >
                {ISSUE_ICONS[issue.level]}
              </span>
              <span style={{ color: ISSUE_COLORS[issue.level] }}>
                {issue.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { RouteDslPreviewPanel };
