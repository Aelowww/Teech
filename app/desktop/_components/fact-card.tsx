"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, RefreshCw, X } from "lucide-react";
import { useRotatingFact } from "@/lib/facts";
import styles from "./fact-card.module.css";

export function FactCard({ role }: { role: "student" | "faculty" }) {
  const { fact, Icon, tone, elapsed, minutesLeft, next } = useRotatingFact(role);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={`${styles.root} ${styles[tone]}`} ref={rootRef}>
      <button className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? "Hide tip" : "Show tip"}>
        <Lightbulb size={17} />
      </button>
      {open && (
        <aside className={styles.card} aria-live="polite" aria-label={fact.kind}>
          <div className={styles.header}>
            <span className={styles.icon}><Icon size={12} /></span>
            <strong>{fact.kind}</strong>
            <button type="button" onClick={next} aria-label="Show another tip"><RefreshCw size={12} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close tip"><X size={13} /></button>
          </div>
          <p className={styles.text} key={fact.text}>{fact.text}</p>
          <div className={styles.footer}>
            <span className={styles.progress}><i style={{ width: `${Math.round(elapsed * 100)}%` }} /></span>
            <small>New tip in {minutesLeft} min</small>
          </div>
        </aside>
      )}
    </div>
  );
}
