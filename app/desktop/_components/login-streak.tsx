"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, Coins, Flame, Gift, Snowflake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login-streak.module.css";

type Streak = {
  current: number;
  points: number;
  activeDates: string[];
  frozenDates: string[];
  dayPoints: Record<string, number>;
  upcomingRewards: number[];
  freezes: number;
};

type StreakRow = {
  current_streak: number;
  points_balance: number | null;
  active_dates: string[] | null;
  frozen_dates: string[] | null;
  day_points: Record<string, number> | null;
  upcoming_rewards: number[] | null;
  freezes_available: number | null;
};

export function LoginStreakCard({ role }: { role: "student" | "faculty" }) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function recordLogin() {
      const { data, error } = await createClient().rpc("record_daily_login", { client_date: dateValue(new Date()) });
      if (!active) return;
      const row = (data as StreakRow[] | null)?.[0];
      if (error || !row) { setFailed(true); return; }
      setStreak({
        current: row.current_streak,
        points: row.points_balance || 0,
        activeDates: row.active_dates || [],
        frozenDates: row.frozen_dates || [],
        dayPoints: row.day_points || {},
        upcomingRewards: row.upcoming_rewards || [],
        freezes: row.freezes_available || 0,
      });
    }
    void recordLogin();
    return () => { active = false; };
  }, []);

  if (failed) return null;
  if (!streak) return <div className={`${styles.card} ${styles.loading}`} aria-hidden="true" />;

  const today = new Date();
  const todayValue = dateValue(today);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const value = dateValue(date);
    const daysAhead = Math.round((date.getTime() - new Date(`${todayValue}T00:00:00`).getTime()) / 86400000);
    const isFuture = daysAhead > 0;
    return {
      value,
      label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      active: streak.activeDates.includes(value),
      frozen: streak.frozenDates.includes(value),
      isToday: value === todayValue,
      isFuture,
      points: isFuture ? streak.upcomingRewards[daysAhead - 1] : streak.dayPoints[value],
    };
  });
  const tomorrowReward = streak.upcomingRewards[0];

  return (
    <section className={styles.card} aria-label="Login streak">
      <div className={styles.summary}>
        <span className={styles.flame}><Flame size={22} /></span>
        <div>
          <strong>{streak.current} day{streak.current === 1 ? "" : "s"} streak</strong>
          <small>
            {tomorrowReward ? `Come back tomorrow for +${tomorrowReward} pts.` : "Come back tomorrow to keep it going."}
            {streak.freezes > 0 && <span className={styles.freezes}><Snowflake size={10} />{streak.freezes}</span>}
          </small>
        </div>
        <span className={styles.points}><Coins size={16} /><b>{streak.points}</b><small>pts</small></span>
      </div>
      <div className={styles.days}>
        {days.map(({ value, label, active, frozen, isToday, isFuture, points }) => (
          <div key={value} className={isFuture ? styles.dayFuture : ""} aria-label={`${value}${active ? ", checked in" : frozen ? ", covered by a streak freeze" : ""}${points ? `, ${points} points` : ""}`}>
            <span className={`${active ? styles.dayActive : ""} ${frozen ? styles.dayFrozen : ""} ${isToday ? styles.dayToday : ""}`}>
              {active && <Check size={15} strokeWidth={3} />}
              {frozen && <Snowflake size={15} strokeWidth={2.5} />}
            </span>
            <em>{points ? `+${points}` : " "}</em>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <Link className={styles.exchange} href={`/${role}/points`}>
        <Gift size={18} />
        <span>Exchange points</span>
        <ChevronRight size={18} />
      </Link>
    </section>
  );
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
