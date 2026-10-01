"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Coins, Flame, Gift, Snowflake, Trophy } from "lucide-react";
import { Bone, TextBone, skeletonStyles } from "@/app/mobile/_components/skeleton";
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
  const [selectedDay, setSelectedDay] = useState(() => dateValue(new Date()));

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
  if (!streak) return <LoginStreakSkeleton />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
  const selectedDetail = days.find((day) => day.value === selectedDay) || days.find((day) => day.isToday);
  const milestone = nextMilestone(streak.current);
  const progress = Math.min(100, Math.round((streak.current / milestone) * 100));
  const daysLeft = milestone - streak.current;

  return (
    <section className={styles.card} aria-label="Login streak">
      <div className={`${styles.hero} ${streak.current === 0 ? styles.heroCold : ""}`}>
        <div className={styles.summary}>
          <span className={styles.flame}><Flame size={22} fill="currentColor" /></span>
          <div>
            <strong><b className={styles.count}>{streak.current}</b> day{streak.current === 1 ? "" : "s"} streak</strong>
            <small>{streakMessage(streak.current)}</small>
          </div>
          <Link className={styles.points} href={`/${role}/points`} aria-label={`${streak.points} points. View and exchange points`}>
            <Coins size={14} /><b>{streak.points}</b><small>pts</small>
          </Link>
        </div>
        <div className={styles.milestone}>
          <div className={styles.milestoneText}>
            <span><Trophy size={12} />{daysLeft} day{daysLeft === 1 ? "" : "s"} to a {milestone}-day streak</span>
            <span className={styles.chips}>
              {tomorrowReward ? <span className={styles.tomorrow}><Gift size={10} />+{tomorrowReward} tomorrow</span> : null}
              {streak.freezes > 0 && <span className={styles.freezes} title="Streak freezes"><Snowflake size={10} />{streak.freezes}</span>}
            </span>
          </div>
          <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={milestone} aria-valuenow={streak.current} aria-label="Progress to next milestone">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className={styles.days}>
        {days.map((day, index) => {
          const { value, label, active, frozen, isToday, isFuture, points } = day;
          const selected = value === selectedDay;
          const previous = days[index - 1];
          const linked = previous && (active || frozen) && (previous.active || previous.frozen);
          return (
            <button
              key={value}
              type="button"
              className={`${isFuture ? styles.dayFuture : ""} ${selected ? styles.daySelected : ""} ${active ? styles.dayDone : ""}`}
              aria-pressed={selected}
              aria-label={`${dayName(value, isToday)}: ${dayStatus(day)}`}
              onClick={() => setSelectedDay(value)}
            >
              {index > 0 && <i className={`${styles.link} ${linked ? styles.linked : ""}`} aria-hidden="true" />}
              <span className={`${active ? styles.dayActive : ""} ${frozen ? styles.dayFrozen : ""} ${isToday ? styles.dayToday : ""}`}>
                {active && <Flame size={13} fill="currentColor" strokeWidth={2} />}
                {isFuture && points ? <Gift size={11} strokeWidth={2.2} /> : null}
                {frozen && <Snowflake size={11} strokeWidth={2.5} />}
              </span>
              <em>{points ? `+${points}` : " "}</em>
              <small>{label}</small>
            </button>
          );
        })}
      </div>
      {selectedDetail && (
        <p className={styles.dayDetail} aria-live="polite" key={selectedDetail.value}>
          <strong>{dayName(selectedDetail.value, selectedDetail.isToday)}</strong>
          <span>{dayStatus(selectedDetail)}</span>
        </p>
      )}
      <Link className={styles.exchange} href={`/${role}/points`}>
        <Gift size={14} />
        <span>Exchange points</span>
        <ChevronRight size={14} />
      </Link>
    </section>
  );
}

export function LoginStreakSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.summary}>
        <Bone height={40} round />
        <div>
          <TextBone size={15} width={110} />
          <TextBone size={11} width={170} />
        </div>
        <Bone width={62} height={30} pill />
      </div>
      <div className={skeletonStyles.week}>
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index}>
            <Bone height={26} round />
            <TextBone size={10} width={16} />
            <TextBone size={10} width={10} />
          </div>
        ))}
      </div>
      <Bone width="100%" height={34} radius={12} style={{ marginTop: -4 }} />
      <div className={skeletonStyles.exchange}>
        <Bone height={14} round />
        <TextBone size={12} width={104} />
      </div>
    </div>
  );
}

const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

function nextMilestone(current: number) {
  return MILESTONES.find((milestone) => milestone > current) ?? Math.ceil((current + 1) / 100) * 100;
}

function streakMessage(current: number) {
  if (current === 0) return "Check in today to light your flame.";
  if (current === 1) return "Day one! Every streak starts here.";
  if (current < 7) return "You're heating up. Keep it going!";
  if (current < 14) return "A full week. You're on fire!";
  if (current < 30) return "Unstoppable. Don't break the chain!";
  return "Legendary streak. Keep the flame alive!";
}

type StreakDay = { active: boolean; frozen: boolean; isToday: boolean; isFuture: boolean; points?: number };

function dayName(value: string, isToday: boolean) {
  if (isToday) return "Today";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function dayStatus({ active, frozen, isToday, isFuture, points }: StreakDay) {
  if (active) return points ? `Checked in · earned +${points} pts` : "Checked in";
  if (frozen) return "Covered by a streak freeze";
  if (isFuture) return points ? `Check in to earn +${points} pts` : "Check in to keep your streak";
  if (isToday) return "Not checked in yet";
  return "Missed";
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
