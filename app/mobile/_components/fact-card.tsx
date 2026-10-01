"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lightbulb, RefreshCw, X } from "lucide-react";
import { useRotatingFact } from "@/lib/facts";
import styles from "./fact-card.module.css";

const poppedSlotKey = "teech.fact-popped-slot";
const popInterval = 5 * 60 * 1000;
const firstPopDelay = 3000;
const returnPopDelay = 1500;
const slotPopDelay = 1000;
const popDuration = 7000;
const closeAnimationMs = 200;

function currentSlot() {
  return Math.floor(Date.now() / popInterval);
}

function poppedSlot() {
  try {
    return Number(window.localStorage.getItem(poppedSlotKey));
  } catch {
    return NaN;
  }
}

function markPopped(slot: number) {
  try {
    window.localStorage.setItem(poppedSlotKey, String(slot));
  } catch {
  }
}

export function FactCard({ role }: { role: "student" | "faculty" }) {
  const { fact, Icon, tone, next } = useRotatingFact(role);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [popping, setPopping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const pinnedRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const nextRef = useRef(next);

  useEffect(() => {
    nextRef.current = next;
  });

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const show = useCallback((pinned: boolean) => {
    window.clearTimeout(closeTimerRef.current);
    pinnedRef.current = pinned;
    setPopping(!pinned);
    setClosing(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    pinnedRef.current = false;
    setPopping(false);
    setClosing(true);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, closeAnimationMs);
  }, []);

  useEffect(() => {
    let popTimer: number | undefined;
    let hideTimer: number | undefined;
    let slotTimer: number | undefined;
    let pops = 0;

    function tryPop() {
      const slot = currentSlot();
      if (document.hidden || poppedSlot() === slot) return;
      markPopped(slot);
      if (openRef.current) return;
      if (pops > 0) nextRef.current();
      pops += 1;
      show(false);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!pinnedRef.current) close();
      }, popDuration);
    }

    function queuePop(delay: number) {
      window.clearTimeout(popTimer);
      popTimer = window.setTimeout(tryPop, delay);
    }

    function scheduleNextSlot() {
      slotTimer = window.setTimeout(() => {
        queuePop(0);
        scheduleNextSlot();
      }, popInterval - (Date.now() % popInterval) + slotPopDelay);
    }

    function handleVisibility() {
      if (!document.hidden) queuePop(returnPopDelay);
    }

    queuePop(firstPopDelay);
    scheduleNextSlot();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(popTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(slotTimer);
      window.clearTimeout(closeTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [show, close]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const visible = open && !closing;

  return (
    <div className={`${styles.root} ${styles[tone]}`} ref={rootRef}>
      <button
        className={`${styles.trigger} ${visible ? styles.triggerOpen : ""} ${visible && popping ? styles.triggerPop : ""}`}
        type="button"
        onClick={() => (visible ? close() : show(true))}
        aria-expanded={visible}
        aria-label={visible ? "Hide tip" : "Show tip"}
      >
        <Lightbulb className={styles.bulb} size={19} />
      </button>
      {open && (
        <aside className={`${styles.card} ${closing ? styles.closing : ""}`} aria-live="polite" aria-label={fact.kind} onPointerDown={() => { pinnedRef.current = true; setPopping(false); }}>
          <div className={styles.header}>
            <span className={styles.icon}><Icon size={12} /></span>
            <strong>{fact.kind}</strong>
            <button type="button" onClick={next} aria-label="Show another tip"><RefreshCw size={12} /></button>
            <button type="button" onClick={close} aria-label="Close tip"><X size={13} /></button>
          </div>
          <p className={styles.text} key={fact.text}>{fact.text}</p>
        </aside>
      )}
    </div>
  );
}
