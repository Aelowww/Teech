"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Ban, BadgeCheck, CalendarCheck, CalendarClock, CalendarX, Clock3, GraduationCap, Hourglass, Send, ShieldAlert, ShieldX, UserPlus, UsersRound, type LucideIcon } from "lucide-react";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { useAdmin } from "@/app/admin/_components/admin-shell";
import { BarChart } from "@/app/admin/_components/bar-chart";
import { createClient } from "@/lib/supabase/client";
import { greeting, relativeTime, useRealtimeRefresh } from "@/lib/admin";
import styles from "@/app/admin/_components/console.module.css";

type Counts = { total: number; verified: number; pending: number; rejected: number };
type Recent = { kind: string; name: string; role: string; detail?: string | null; at: string };
type Dashboard = {
  students: Counts;
  faculty: Counts & { available: number };
  appointments: { total: number; pending: number; confirmed: number; declined: number; cancelled: number; today: number; upcoming: number };
  daily: { date: string; requests: number; signUps: number }[];
  recent: Recent[];
};

const statusRows: { key: "pending" | "confirmed" | "declined" | "cancelled"; label: string; Icon: LucideIcon }[] = [
  { key: "pending", label: "Pending", Icon: Hourglass },
  { key: "confirmed", label: "Confirmed", Icon: CalendarCheck },
  { key: "declined", label: "Declined", Icon: CalendarX },
  { key: "cancelled", label: "Cancelled", Icon: Ban },
];

export default function Page() {
  const { name } = useAdmin();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: result, error: loadError } = await createClient().rpc("admin_dashboard");
    if (loadError) setError(loadError.message);
    else {
      setError("");
      setData(result as Dashboard);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => { if (active) await load(); };
    void run();
    return () => { active = false; };
  }, [load]);

  useRealtimeRefresh("profiles,appointment_requests", load);

  if (!data && !error) return <AppLoader />;

  const firstName = name.trim().split(/\s+/)[0] || "Admin";
  const pendingTotal = (data?.students.pending ?? 0) + (data?.faculty.pending ?? 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.greeting}>
          <span className={styles.greetingAvatar}>{firstName.charAt(0).toUpperCase()}</span>
          <div>
            <small>{greeting()}</small>
            <strong>{firstName}</strong>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <span>{today}</span>
          <span className={styles.live}><i aria-hidden="true" />Live</span>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <>
          <section className={styles.tiles} aria-label="Overview">
            <Tile href="/admin/students" label="Students" Icon={GraduationCap} value={data.students.total} sub={`${data.students.verified} verified · ${data.students.pending} pending`} />
            <Tile href="/admin/faculty" label="Faculty" Icon={UsersRound} value={data.faculty.total} sub={`${data.faculty.verified} verified · ${data.faculty.available} available now`} />
            <Tile href={data.faculty.pending > data.students.pending ? "/admin/faculty" : "/admin/students"} label="Waiting for review" Icon={ShieldAlert} value={pendingTotal} sub={pendingTotal ? "Approve or reject to unlock accounts" : "You're all caught up"} alert={pendingTotal > 0} />
            <Tile label="Consultations today" Icon={CalendarClock} value={data.appointments.today} sub={`${data.appointments.upcoming} upcoming confirmed`} />
          </section>

          <section className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>New sign-ups</h2>
                <small>Last 14 days · {sum(data.daily.map((day) => day.signUps))} total</small>
              </div>
              <BarChart label="New sign-ups per day" unit="sign-ups" data={data.daily.map((day) => ({ date: day.date, value: day.signUps }))} />
            </div>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Consultation requests</h2>
                <small>Last 14 days · {sum(data.daily.map((day) => day.requests))} total</small>
              </div>
              <BarChart label="Consultation requests per day" unit="requests" data={data.daily.map((day) => ({ date: day.date, value: day.requests }))} />
            </div>
          </section>

          <section className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Verification progress</h2>
                <small>Verified accounts</small>
              </div>
              <div className={styles.statusRows}>
                <StatusRow tone="accent" Icon={GraduationCap} label="Students" value={data.students.verified} total={data.students.total} detail={`${data.students.pending} pending · ${data.students.rejected} rejected`} />
                <StatusRow tone="accent" Icon={UsersRound} label="Faculty" value={data.faculty.verified} total={data.faculty.total} detail={`${data.faculty.pending} pending · ${data.faculty.rejected} rejected`} />
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Consultations by status</h2>
                <small>{data.appointments.total} all time</small>
              </div>
              <div className={styles.statusRows}>
                {statusRows.map(({ key, label, Icon }) => (
                  <StatusRow key={key} tone={key} Icon={Icon} label={label} value={data.appointments[key]} total={data.appointments.total} />
                ))}
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>Recent activity</h2>
              <small>Updates live</small>
            </div>
            {data.recent.length ? (
              <ul className={styles.activity}>
                {data.recent.map((item, index) => <ActivityItem key={`${item.kind}-${item.at}-${index}`} item={item} />)}
              </ul>
            ) : (
              <p className={styles.empty}>No activity yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Tile({ href, label, Icon, value, sub, alert = false }: { href?: string; label: string; Icon: LucideIcon; value: number; sub: string; alert?: boolean }) {
  const content = (
    <>
      <span className={styles.tileTop}>{label}<span className={styles.tileIcon}><Icon size={17} /></span></span>
      <span className={styles.tileValue}>{value.toLocaleString()}</span>
      <span className={styles.tileSub}>{sub}</span>
    </>
  );
  const className = `${styles.tile} ${alert ? styles.tileAlert : ""}`;
  return href ? <Link className={className} href={href}>{content}</Link> : <div className={className}>{content}</div>;
}

function StatusRow({ tone, Icon, label, value, total, detail }: { tone: string; Icon: LucideIcon; label: string; value: number; total: number; detail?: string }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`${styles.statusRow} ${styles[`tone_${tone}`]}`}>
      <span className={styles.statusLabel}>
        <Icon size={16} aria-hidden="true" />
        {label}
        {detail && <small>{detail}</small>}
        <b>{value}{total ? ` / ${total}` : ""}</b>
      </span>
      <span className={styles.meter} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><i style={{ width: `${percent}%` }} /></span>
    </div>
  );
}

function ActivityItem({ item }: { item: Recent }) {
  const role = item.role === "faculty" ? "Faculty" : "Student";
  const copy: Record<string, { Icon: LucideIcon; text: string; tone?: string }> = {
    sign_up: { Icon: UserPlus, text: `${item.name} created a ${role.toLowerCase()} account` },
    request: { Icon: Send, text: `${item.name} requested a consultation${item.detail ? ` with ${item.detail}` : ""}` },
    review_approved: { Icon: BadgeCheck, text: `${item.name} was verified`, tone: styles.good },
    review_rejected: { Icon: ShieldX, text: `${item.name} was rejected`, tone: styles.bad },
    review_resubmitted: { Icon: Clock3, text: `${item.name} resubmitted their ID` },
  };
  const { Icon, text, tone } = copy[item.kind] || { Icon: Clock3, text: item.name };
  return (
    <li>
      <span className={`${styles.activityIcon} ${tone || ""}`}><Icon size={16} /></span>
      <span className={styles.activityText}>{text}<small>{role}</small></span>
      <time dateTime={item.at}>{relativeTime(item.at)}</time>
    </li>
  );
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
