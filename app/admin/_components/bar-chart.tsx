"use client";

import { useState } from "react";
import styles from "./console.module.css";

type Point = { date: string; value: number };

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BarChart({ label, unit, data }: { label: string; unit: string; data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const peak = Math.max(0, ...data.map((point) => point.value));
  const top = Math.max(4, Math.ceil(peak / 4) * 4);
  const ticks = [top, top / 2, 0];

  return (
    <div>
      <div className={styles.chart} role="img" aria-label={`${label}: ${data.map((point) => `${shortDate(point.date)} ${point.value}`).join(", ")}`}>
        <div className={styles.yAxis} aria-hidden="true">
          {ticks.map((tick) => <span key={tick} style={{ bottom: `${(tick / top) * 100}%` }}>{tick}</span>)}
        </div>
        <div className={styles.plot}>
          {ticks.map((tick) => <span key={tick} className={`${styles.gridline} ${tick === 0 ? styles.baseline : ""}`} style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden="true" />)}
          <div className={styles.columns}>
            {data.map((point, index) => {
              const height = (point.value / top) * 100;
              return (
                <div
                  key={point.date}
                  className={styles.column}
                  tabIndex={0}
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  aria-label={`${shortDate(point.date)}: ${point.value} ${unit}`}
                >
                  <span className={styles.bar} style={{ height: `${height}%` }} />
                  {active === index && (
                    <span className={styles.tooltip} style={{ bottom: `calc(${height}% + 8px)` }}>
                      <strong>{point.value} {unit}</strong>
                      <small>{shortDate(point.date)}</small>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.xAxis} aria-hidden="true">
          {data.map((point, index) => <span key={point.date}>{(data.length - 1 - index) % 4 === 0 ? shortDate(point.date) : ""}</span>)}
        </div>
      </div>
      <details className={styles.dataTable}>
        <summary>View as table</summary>
        <table>
          <thead><tr><th>Date</th><th>{unit.charAt(0).toUpperCase() + unit.slice(1)}</th></tr></thead>
          <tbody>{data.map((point) => <tr key={point.date}><td>{shortDate(point.date)}</td><td>{point.value}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}
