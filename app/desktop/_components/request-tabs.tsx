"use client";

import styles from "./request-tabs.module.css";

export type RequestTab = "all" | "pending" | "confirmed" | "closed";

const tabLabels: { id: RequestTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "closed", label: "Closed" },
];

export function matchesTab(status: string, tab: RequestTab) {
  if (tab === "all") return true;
  if (tab === "closed") return status === "declined" || status === "cancelled";
  return status === tab;
}

export function parseTab(value: string | null): RequestTab {
  return value === "pending" || value === "confirmed" || value === "closed" ? value : "all";
}

export function RequestTabs({ statuses, active, onChange }: { statuses: string[]; active: RequestTab; onChange: (tab: RequestTab) => void }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Filter requests">
      {tabLabels.map(({ id, label }) => {
        const count = statuses.filter((status) => matchesTab(status, id)).length;
        return (
          <button key={id} type="button" role="tab" aria-selected={active === id} className={active === id ? styles.active : ""} onClick={() => onChange(id)}>
            {label}
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
