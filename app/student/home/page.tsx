"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, BrandLogo, CardList, ProfilePhoto } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string };
type Appointment = { id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string };

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facultyCount, setFacultyCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/student/sign-in");
        return;
      }
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!currentProfile || currentProfile.role !== "student") {
        await supabase.auth.signOut();
        router.replace("/student/sign-in");
        return;
      }
      const [requestsResult, facultyResult] = await Promise.all([
        supabase.from("appointment_requests").select("id, faculty_name, preferred_date, preferred_time, reason, status").eq("student_profile_id", currentProfile.id).order("created_at", { ascending: false }),
        supabase.from("faculty_availability").select("faculty_profile_id").eq("is_available", true).not("available_date", "is", null).gte("available_date", new Date().toISOString().slice(0, 10)),
      ]);
      if (!active) return;
      setProfile(currentProfile);
      setAppointments(requestsResult.data as Appointment[] || []);
      setFacultyCount(new Set(facultyResult.data?.map((slot) => slot.faculty_profile_id) || []).size);
    }
    void loadDashboard();
    return () => { active = false; };
  }, [router]);

  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending");
  const nextAppointment = [...pendingAppointments].sort((first, second) => first.preferred_date.localeCompare(second.preferred_date))[0];
  const requestItems = pendingAppointments.slice(0, 1).map((appointment) => ({
    title: appointment.faculty_name || "Faculty",
    description: `${formatLongDate(appointment.preferred_date)} - ${formatTime(appointment.preferred_time)}`,
    status: "Pending",
    href: "/student/appointment-requests?status=pending",
  }));
  const formattedNextDate = nextAppointment ? formatShortDate(nextAppointment.preferred_date) : "None";
  const week = getCurrentWeek();

  return (
    <MobileLayout className={styles.screen} role="student" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <Link href="/student/notifications" aria-label="Notifications"><Bell size={19} /></Link>
        </header>
        <div className={styles.greeting}>
          <ProfilePhoto inline />
          <div><strong>{getGreeting()}</strong><small>{profile?.full_name || "Student"}</small></div>
        </div>
        <div className={styles.metrics}>
          <div className={styles.metric}><strong>{pendingAppointments.length}</strong><span>Pending Requests</span></div>
          <div className={styles.metric}><strong className={styles.metricDate}>{formattedNextDate}</strong><span>Next Consultation</span></div>
          <div className={styles.metric}><strong>{facultyCount}</strong><span>Available Faculty</span></div>
        </div>
        <h2 className={styles.sectionTitle}>Calendar <small>This Week</small></h2>
        <div className={styles.weekStrip}>{week.map(({ label, day, isToday }) => <div key={`${label}-${day}`}><small>{label}</small><span className={isToday ? styles.selectedDate : ""}>{day}</span></div>)}</div>
        <h2 className={styles.sectionTitle}>Pending Request</h2>
        {requestItems.length > 0 ? <CardList items={requestItems} /> : <p className={styles.emptyState}>No pending requests.</p>}
      </div>
    </MobileLayout>
  );
}

function formatLongDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
function formatShortDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function getGreeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,"; }
function getCurrentWeek() {
  const today = new Date();
  const start = new Date(today); start.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    return { label: date.toLocaleDateString("en-US", { weekday: "short" }), day: date.getDate(), isToday: date.toDateString() === today.toDateString() };
  });
}
