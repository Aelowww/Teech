"use client";

import { useEffect, useState } from "react";
import { Check, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login-streak.module.css";

type Streak = { current: number; longest: number; activeDates: string[] };

export function LoginStreakCard() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function recordLogin() {
      const { data, error } = await createClient().rpc("record_daily_login", { client_date: dateValue(new Date()) });
      if (!active) return;
      const row = (data as { current_streak: number; longest_streak: number; active_dates: string[] }[] | null)?.[0];
      if (error || !row) { setFailed(true); return; }
      setStreak({ current: row.current_streak, longest: row.longest_streak, activeDates: row.active_dates || [] });
    }
    void recordLogin();
    return () => { active = false; };
  }, []);

  // Hide the card rather than break the dashboard if streaks are unavailable.
  if (failed) return null;
  if (!streak) return <div className={`${styles.card} ${styles.loading}`} aria-hidden="true" />;

  // Show the current week from Monday to Sunday.
  const today = new Date();
  const todayValue = dateValue(today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const value = dateValue(date);
    return {
      value,
      label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      active: streak.activeDates.includes(value),
      isToday: value === todayValue,
      isFuture: value > todayValue,
    };
  });

  return (
    <section className={styles.card} aria-label="Login streak">
      <div className={styles.summary}>
        <span className={styles.flame}><Flame size={20} /></span>
        <div>
          <strong>{streak.current} day{streak.current === 1 ? "" : "s"} streak</strong>
          <small>{streakMessage(streak)}</small>
        </div>
        <span className={styles.best}>Best<b>{streak.longest}</b></span>
      </div>
      <div className={styles.days}>
        {days.map(({ value, label, active, isToday, isFuture }) => (
          <div key={value} className={isFuture ? styles.dayFuture : ""} aria-label={`${value}${active ? ", logged in" : ""}`}>
            <span className={`${active ? styles.dayActive : ""} ${isToday ? styles.dayToday : ""}`}>{active && <Check size={11} strokeWidth={3} />}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function streakMessage({ current, longest }: Streak) {
  if (current <= 1) return "Come back tomorrow to start a streak.";
  if (current >= longest) return "Your best streak yet. Keep it going!";
  return "Log in tomorrow to keep it going.";
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
