import React, { useCallback, useState } from "react";

import styles from "./BuilderPage.module.css";

export const StringArrayEditor: React.FC<{
  label: string;
  required?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}> = ({ label, required, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const addItem = useCallback(() => {
    const v = inputValue.trim();
    if (v && !value.includes(v)) {
      onChange([...value, v]);
      setInputValue("");
    }
  }, [inputValue, value, onChange]);

  const removeItem = useCallback(
    (idx: number) => {
      onChange(value.filter((_, i) => i !== idx));
    },
    [value, onChange],
  );

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>
        {label}{" "}
        {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          minHeight: "1.5rem",
        }}
      >
        {value.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.125rem 0.5rem",
              fontSize: "var(--text-xs)",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text)",
            }}
          >
            {item}
            <button
              onClick={() => removeItem(idx)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--color-text-muted)",
                fontSize: "0.75rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        <input
          className={styles.fieldInput}
          style={{ flex: 1 }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addItem())
          }
        />
        <button
          className={styles.toolbarBtn}
          onClick={addItem}
          disabled={!inputValue.trim()}
          style={{ padding: "0.375rem 0.5rem", fontSize: "var(--text-xs)" }}
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export const NumberArrayEditor: React.FC<{
  label: string;
  required?: boolean;
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  description?: string;
}> = ({ label, required, value, onChange, placeholder, description }) => {
  const [inputValue, setInputValue] = useState("");

  const addItem = useCallback(() => {
    const v = inputValue.trim();
    if (v === "") return;
    const num = Number(v);
    if (isNaN(num)) return;
    onChange([...value, num]);
    setInputValue("");
  }, [inputValue, value, onChange]);

  const removeItem = useCallback(
    (idx: number) => {
      onChange(value.filter((_, i) => i !== idx));
    },
    [value, onChange],
  );

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>
        {label}{" "}
        {required && <span style={{ color: "var(--color-danger)" }}>*</span>}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.25rem",
          minHeight: "1.75rem",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          [
        </span>
        {value.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.125rem 0.5rem",
              fontSize: "var(--text-xs)",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text)",
            }}
          >
            {item}
            <button
              onClick={() => removeItem(idx)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--color-text-muted)",
                fontSize: "0.75rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ]
        </span>
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        <input
          className={styles.fieldInput}
          style={{ flex: 1 }}
          type="number"
          step="any"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addItem())
          }
        />
        <button
          className={styles.toolbarBtn}
          onClick={addItem}
          disabled={!inputValue.trim() || isNaN(Number(inputValue))}
          style={{ padding: "0.375rem 0.5rem", fontSize: "var(--text-xs)" }}
        >
          + Add
        </button>
      </div>
      {description && (
        <span
          style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}
        >
          {description}
        </span>
      )}
    </div>
  );
};
