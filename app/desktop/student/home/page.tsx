"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, UsersRound } from "lucide-react";
import { AppShell } from "@/app/desktop/_components/app-shell";
import { CardList, ProfilePhoto, SpotlightCard, UpNextCard } from "@/app/desktop/_components/ui";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import { LoginStreakCard } from "@/app/desktop/_components/login-streak";
import { FactCard } from "@/app/desktop/_components/fact-card";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { CountUp } from "@/app/desktop/_components/count-up";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";
import { facultyAvatarUrls, signedAvatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null; course_year: string | null };
type Appointment = { id: string; faculty_profile_id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 3;

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facultyPhotos, setFacultyPhotos] = useState<Map<string, string>>(() => new Map());
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
        supabase.from("appointment_requests").select("id, faculty_profile_id, faculty_name, preferred_date, preferred_time, reason, status, meeting_location").eq("student_profile_id", currentProfile.id).order("created_at", { ascending: false }),
        supabase.from("faculty_availability").select("faculty_profile_id").eq("is_available", true).not("available_date", "is", null).gte("available_date", localDateValue()),
      ]);
      if (!active) return;
      setProfile(currentProfile);
      void signedAvatarUrl(supabase, currentProfile.avatar_path).then((url) => { if (active) setPhotoUrl(url); });
      setAppointments(requestsResult.data as Appointment[] || []);
      void facultyAvatarUrls(supabase, ((requestsResult.data || []) as Appointment[]).map((appointment) => appointment.faculty_profile_id)).then((urls) => { if (active) setFacultyPhotos(urls); });
      setFacultyCount(new Set(facultyResult.data?.map((slot) => slot.faculty_profile_id) || []).size);
      setIsLoading(false);
      channel = supabase
        .channel(uniqueChannelName(`student-dashboard-${currentProfile.id}`))
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
  const confirmed = upcoming
    .filter((appointment) => appointment.status === "confirmed")
    .sort((first, second) => `${first.preferred_date}T${first.preferred_time}`.localeCompare(`${second.preferred_date}T${second.preferred_time}`));
  const nextAppointment = confirmed[0];
  const fullName = profile?.full_name || "Student";
  const closedCount = appointments.filter((appointment) => appointment.status === "declined" || appointment.status === "cancelled").length;
  const overview = [
    { label: "Pending", count: pendingAppointments.length, tone: styles.dotPending, href: "/student/appointment-requests?status=pending" },
    { label: "Confirmed", count: confirmed.length, tone: styles.dotConfirmed, href: "/student/appointment-requests?status=confirmed" },
    { label: "Closed", count: closedCount, tone: styles.dotClosed, href: "/student/appointment-requests?status=closed" },
  ];
  const overviewTotal = overview.reduce((total, item) => total + item.count, 0);
  const pendingItems = pendingAppointments.slice(0, pendingPreviewLimit).map((appointment) => ({
    title: appointment.faculty_name || "Faculty",
    description: `${formatLongDate(appointment.preferred_date)} - ${formatTime(appointment.preferred_time)}`,
    status: "Pending",
    imageUrl: facultyPhotos.get(appointment.faculty_profile_id),
    href: `/student/appointment-requests/${appointment.id}`,
  }));

  return (
    <AppShell
      role="student"
      active="home"
      name={fullName}
      subtitle={profile?.course_year ? `Student • ${profile.course_year}` : "Student"}
      avatarSrc={photoUrl}
    >
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.greeting}>
            <ProfilePhoto inline small src={photoUrl} />
            <div><small>{getGreeting()}</small><strong>{fullName}</strong></div>
          </div>
          <Link className={`${buttonStyles.button} ${buttonStyles.primary}`} href="/student/faculty">
            <Plus size={16} strokeWidth={2.25} />
            Book consultation
          </Link>
        </header>

        <div className={styles.layout}>
          <div className={styles.main}>
            <FactCard role="student" />

            {nextAppointment ? (
              <UpNextCard
                eyebrow="Up next"
                title={nextAppointment.faculty_name || "Faculty consultation"}
                date={nextAppointment.preferred_date}
                meta={[formatTime(nextAppointment.preferred_time), nextAppointment.meeting_location || "Location to be confirmed"]}
                href={`/student/appointment-requests/${nextAppointment.id}`}
                actionLabel="View details"
                avatar={facultyPhotos.get(nextAppointment.faculty_profile_id) ?? null}
              />
            ) : (
              <SpotlightCard
                muted
                eyebrow="No upcoming consultation"
                title="Book a consultation"
                details={[{ icon: <UsersRound size={15} />, text: facultyCount === 1 ? "1 faculty member has open dates" : `${facultyCount} faculty members have open dates` }]}
                href="/student/faculty"
                actionLabel="Find faculty"
              />
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Awaiting Response {pendingAppointments.length > 0 && <span className={styles.count}>{pendingAppointments.length}</span>}
                {pendingAppointments.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/student/appointment-requests?status=pending">See all</Link>}
              </h2>
              {pendingItems.length > 0 ? <CardList items={pendingItems} /> : <p className={styles.emptyState}>No requests are waiting on faculty.</p>}
            </section>
          </div>

          <aside className={styles.rail}>
            <LoginStreakCard role="student" />
            <section className={styles.overview} aria-label="Your requests">
              <h2>Your requests</h2>
              {overviewTotal > 0 && (
                <div className={styles.split} aria-hidden="true">
                  {overview.filter((item) => item.count > 0).map(({ label, count, tone }) => (
                    <i key={label} className={tone} style={{ flexGrow: count }} />
                  ))}
                </div>
              )}
              <div className={styles.overviewList}>
                {overview.map(({ label, count, tone, href }) => (
                  <Link className={styles.overviewRow} href={href} key={label}>
                    <span><i className={tone} aria-hidden="true" />{label}</span>
                    <b><CountUp value={count} /></b>
                  </Link>
                ))}
              </div>
              <Link className={styles.overviewAll} href="/student/appointment-requests">View all requests<ChevronRight size={15} /></Link>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function formatLongDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" }); }
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
