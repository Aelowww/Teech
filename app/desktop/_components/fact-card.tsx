"use client";

import { RefreshCw } from "lucide-react";
import { useRotatingFact } from "@/lib/facts";
import styles from "./fact-card.module.css";

export function FactCard({ role }: { role: "student" | "faculty" }) {
  const { fact, Icon, tone, elapsed, minutesLeft, next } = useRotatingFact(role);

  return (
    <section className={`${styles.card} ${styles[tone]}`} aria-live="polite">
      <Icon className={styles.watermark} size={160} strokeWidth={1.2} aria-hidden="true" />
      <span className={styles.icon}><Icon size={26} /></span>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.pill}>{fact.kind}</span>
          <button className={styles.next} type="button" onClick={next} aria-label="Show another tip">
            <RefreshCw size={14} />Another
          </button>
        </div>
        <p className={styles.text} key={fact.text}>{fact.text}</p>
        <div className={styles.footer}>
          <span className={styles.progress}><i style={{ width: `${Math.round(elapsed * 100)}%` }} /></span>
          <small>New tip in {minutesLeft} min</small>
        </div>
      </div>
    </section>
  );
}
