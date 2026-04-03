import React from "react";

import type { FieldSchema } from "@/lib/dslMutations";

import { NumberArrayEditor, StringArrayEditor } from "./builderPageArrayEditors";
import styles from "./BuilderPage.module.css";
import { CustomSelect } from "./builderPageCustomSelect";

export const FieldEditor: React.FC<{
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}> = ({ schema, value, onChange }) => {
  switch (schema.type) {
    case "string":
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {schema.label}{" "}
            {schema.required && (
              <span style={{ color: "var(--color-danger)" }}>*</span>
            )}
          </label>
          <input
            className={styles.fieldInput}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={schema.placeholder}
          />
          {schema.description && (
            <span
              style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}
            >
              {schema.description}
            </span>
          )}
        </div>
      );
    case "number":
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {schema.label}{" "}
            {schema.required && (
              <span style={{ color: "var(--color-danger)" }}>*</span>
            )}
          </label>
          <input
            className={styles.fieldInput}
            type="number"
            step="any"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v === "" ? undefined : Number(v));
            }}
            placeholder={schema.placeholder}
          />
        </div>
      );
    case "boolean":
      return (
        <div className={styles.fieldGroup}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              style={{ accentColor: "var(--color-primary)" }}
            />
            <span
              className={styles.fieldLabel}
              style={{ textTransform: "none" }}
            >
              {schema.label}
            </span>
          </label>
        </div>
      );
    case "select":
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {schema.label}{" "}
            {schema.required && (
              <span style={{ color: "var(--color-danger)" }}>*</span>
            )}
          </label>
          <CustomSelect
            value={(value as string) ?? ""}
            options={schema.options ?? []}
            onChange={(v) => onChange(v || undefined)}
            placeholder="— select —"
          />
        </div>
      );
    case "string[]":
      return (
        <StringArrayEditor
          label={schema.label}
          required={schema.required}
          value={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={schema.placeholder}
        />
      );
    case "number[]": {
      let arr: number[] = [];
      if (Array.isArray(value)) {
        arr = value.map(Number).filter((n) => !isNaN(n));
      } else if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed))
            arr = parsed.map(Number).filter((n) => !isNaN(n));
        } catch {
          /* ignore */
        }
      }
      return (
        <NumberArrayEditor
          label={schema.label}
          required={schema.required}
          value={arr}
          onChange={onChange}
          placeholder={schema.placeholder}
          description={schema.description}
        />
      );
    }
    case "json":
      return (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {schema.label}{" "}
            {schema.required && (
              <span style={{ color: "var(--color-danger)" }}>*</span>
            )}
          </label>
          <textarea
            className={styles.fieldTextarea}
            value={
              value !== undefined && value !== null
                ? typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={3}
            style={{ fontSize: "var(--text-xs)" }}
          />
          {schema.description && (
            <span
              style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}
            >
              {schema.description}
            </span>
          )}
        </div>
      );
    default:
      return null;
  }
};
