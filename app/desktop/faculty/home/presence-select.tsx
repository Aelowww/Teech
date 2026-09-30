"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./presence-select.module.css";

export type PresenceStatus = "available" | "in_meeting" | "busy";

const options: { value: PresenceStatus; label: string; description: string }[] = [
  { value: "available", label: "Available", description: "Listed as available to students" },
  { value: "in_meeting", label: "In a meeting", description: "Visible, but not listed as available" },
  { value: "busy", label: "Busy (in a class)", description: "Visible, but not listed as available" },
];

export function PresenceSelect({ value, onChange }: { value: PresenceStatus; onChange: (next: PresenceStatus) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    optionRefs.current[options.findIndex((option) => option.value === value)]?.focus();
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open, value]);

  function handleMenuKey(event: React.KeyboardEvent) {
    const index = optionRefs.current.findIndex((element) => element === document.activeElement);
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); rootRef.current?.querySelector("button")?.focus(); }
    if (event.key === "ArrowDown") { event.preventDefault(); optionRefs.current[(index + 1) % options.length]?.focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); optionRefs.current[(index - 1 + options.length) % options.length]?.focus(); }
    if (event.key === "Tab") setOpen(false);
  }

  function choose(next: PresenceStatus) {
    setOpen(false);
    onChange(next);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${styles[`trigger_${current.value}`]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Your status: ${current.label}`}
        onClick={() => setOpen((state) => !state)}
      >
        <span className={`${styles.dot} ${styles[current.value]}`} />
        <span className={styles.triggerLabel}>{current.label}</span>
        <ChevronDown size={14} strokeWidth={2.4} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>
      {open && (
        <div className={styles.menu} role="listbox" aria-label="Your status" onKeyDown={handleMenuKey}>
          <p className={styles.menuTitle} aria-hidden="true">Set your status</p>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={styles.option}
              onClick={() => choose(option.value)}
            >
              <span className={`${styles.dot} ${styles[option.value]}`} />
              <span className={styles.optionText}>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              {option.value === value && <Check size={16} strokeWidth={2.5} className={styles.check} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
