import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import styles from "./BuilderPage.module.css";

export const CustomSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, options, onChange, placeholder = "— select —" }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className={styles.customSelect} ref={triggerRef}>
      <div
        className={
          open ? styles.customSelectTriggerOpen : styles.customSelectTrigger
        }
        onClick={() => setOpen(!open)}
      >
        <span>{value || placeholder}</span>
        <svg
          className={`${styles.customSelectChevron} ${open ? styles.customSelectChevronOpen : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={styles.customSelectDropdown}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt}
                className={
                  opt === value
                    ? styles.customSelectOptionActive
                    : styles.customSelectOption
                }
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt === value ? (
                  <svg
                    className={styles.customSelectCheck}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M3 8.5l3 3 7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className={styles.customSelectPlaceholder} />
                )}
                {opt || "(none)"}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
