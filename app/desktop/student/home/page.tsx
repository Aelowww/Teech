"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock3, UserRound } from "lucide-react";
import { AppShell } from "@/app/desktop/_components/app-shell";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null; course_year: string | null };
type Appointment = { id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 3;

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facultyCount, setFacultyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/student/sign-in");
        return;
      }
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_path, course_year")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!currentProfile || currentProfile.role !== "student") {
        await supabase.auth.signOut();
        router.replace("/student/sign-in");
        return;
      }
      const [requestsResult, facultyResult] = await Promise.all([
        supabase.from("appointment_requests").select("id, faculty_name, preferred_date, preferred_time, reason, status, meeting_location").eq("student_profile_id", currentProfile.id).order("created_at", { ascending: false }),
        supabase.from("faculty_availability").select("faculty_profile_id").eq("is_available", true).not("available_date", "is", null).gte("available_date", localDateValue()),
      ]);
      if (!active) return;
      setProfile(currentProfile);
      setAppointments(requestsResult.data as Appointment[] || []);
      setFacultyCount(new Set(facultyResult.data?.map((slot) => slot.faculty_profile_id) || []).size);
      setIsLoading(false);
      channel = supabase
        .channel(`student-dashboard-${currentProfile.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointment_requests", filter: `student_profile_id=eq.${currentProfile.id}` },
          (payload) => {
            const changedAppointment = payload.new as Appointment;
            setAppointments((current) => {
              if (payload.eventType === "INSERT") return [changedAppointment, ...current];
              return current.map((appointment) => appointment.id === changedAppointment.id ? { ...appointment, ...changedAppointment } : appointment);
            });
          },
        )
        .subscribe();
    }
    void loadDashboard();
    return () => {
      active = false;
      if (channel) void createClient().removeChannel(channel);
    };
  }, [router]);

  if (isLoading) return <AppLoader />;

  const now = localDateTimeValue();
  const upcoming = appointments.filter((appointment) => `${appointment.preferred_date}T${appointment.preferred_time}` >= now);
  const pendingAppointments = upcoming.filter((appointment) => appointment.status === "pending");
  const nextAppointment = upcoming
    .filter((appointment) => appointment.status === "confirmed")
    .sort((first, second) => `${first.preferred_date}T${first.preferred_time}`.localeCompare(`${second.preferred_date}T${second.preferred_time}`))[0];
  const upcomingConfirmed = upcoming.filter((appointment) => appointment.status === "confirmed");
  const fullName = profile?.full_name || "Student";
  const today = localDateValue();

  return (
    <AppShell
      role="student"
      active="home"
      name={fullName}
      subtitle={profile?.course_year ? `Student • ${profile.course_year}` : "Student"}
      avatarSrc={avatarUrl(profile?.avatar_path)}
    >
      <div className={styles.dashboard}>
        <div className={styles.center}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <h1>{getGreeting()} {fullName.split(" ")[0]}</h1>
              <p>Here&apos;s a quick overview of your schedule and pending requests for this week.</p>
              <div className={styles.heroActions}>
                <Link className={styles.pillButton} href="/student/faculty">Book Appointment</Link>
                <Link className={styles.outlineButton} href="/student/faculty?filter=all">View Faculty</Link>
              </div>
            </div>
            <div className={styles.summary}>
              <div className={`${styles.stat} ${styles.statBlue}`}><small>Pending Requests</small><strong>{pendingAppointments.length}</strong></div>
              <div className={`${styles.stat} ${styles.statIndigo}`}><small>Upcoming Appointments</small><strong>{upcomingConfirmed.length}</strong></div>
              <div className={`${styles.stat} ${styles.statWhite}`}><small>Available Faculty</small><strong>{facultyCount}</strong></div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}><h2>Calendar</h2><small>This Week</small></div>
            <div className={styles.week}>
              {currentWeek().map((day) => (
                <div className={styles.weekDay} key={day.value}>
                  <span>{day.weekday}</span>
                  <strong className={day.value === today ? styles.today : ""}>{day.date}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Pending Request</h2>
              <small>{pendingAppointments.length === 1 ? "1 request" : `${pendingAppointments.length} requests`}</small>
            </div>
            {pendingAppointments.length > 0 ? (
              <div className={styles.requestList}>
                {pendingAppointments.slice(0, pendingPreviewLimit).map((appointment) => (
                  <Link className={styles.requestRow} href={`/student/appointment-requests/${appointment.id}`} key={appointment.id}>
                    <span className={styles.personIcon}><UserRound size={20} /></span>
                    <div><strong>{appointment.faculty_name || "Faculty"}</strong><small>{formatLongDate(appointment.preferred_date)} • {formatTime(appointment.preferred_time)}</small></div>
                    <em>Pending</em>
                  </Link>
                ))}
                {pendingAppointments.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/student/appointment-requests?status=pending">See all</Link>}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Clock3 size={28} />
                <strong>No pending requests</strong>
                <small>All requests are currently approved or scheduled.</small>
              </div>
            )}
          </section>
        </div>

        <div className={styles.side}>
          <section className={styles.sideCard}>
            <h2>Status</h2>
            <div className={styles.status}>
              <span><i />Available</span>
              <ChevronDown size={16} />
            </div>
          </section>

          <section className={`${styles.sideCard} ${styles.sideCardTinted}`}>
            <h2>I&apos;m a student</h2>
            <p>Book a consultation appointment with your teacher.</p>
            <Link className={styles.outlineButton} href="/student/faculty">Book Now</Link>
          </section>

          <section className={styles.sideCard}>
            <h2>Upcoming Appointment</h2>
            {nextAppointment ? (
              <div className={styles.appointment}>
                <div className={styles.appointmentPerson}>
                  <span className={styles.personIcon}><UserRound size={20} /></span>
                  <div><strong>{nextAppointment.faculty_name || "Faculty consultation"}</strong><small>{formatLongDate(nextAppointment.preferred_date, "long")} • {formatTime(nextAppointment.preferred_time)}</small></div>
                </div>
                <Link className={styles.outlineButton} href={`/student/appointment-requests/${nextAppointment.id}`}>View Details</Link>
              </div>
            ) : (
              <p>No confirmed consultations yet.</p>
            )}
          </section>

          <section className={`${styles.sideCard} ${styles.quickActions}`}>
            <h2>Quick Actions</h2>
            <Link className={styles.pillButton} href="/student/home">Back to Home</Link>
            <Link className={styles.pillButton} href="/student/faculty">Book Appointment</Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

// The Sunday-to-Saturday week containing today.
function currentWeek() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + index);
    return {
      value: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
      weekday: day.toLocaleDateString("en-US", { weekday: "short" }),
      date: day.getDate(),
    };
  });
}

function formatLongDate(value: string, style: "short" | "long" = "short") {
  const date = new Date(`${value}T00:00:00`);
  return style === "long"
    ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
}
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function getGreeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,"; }
function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function localDateTimeValue() {
  const now = new Date();
  return `${localDateValue()}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
