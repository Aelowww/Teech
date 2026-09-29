"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { MobileLayout, BrandLogo, CardList, ProfilePhoto, SpotlightCard } from "@/app/mobile/_components/ui";
import { NotificationBell } from "@/app/mobile/_components/notification-bell";
import { LoginStreakCard } from "@/app/mobile/_components/login-streak";
import { SupportChat } from "@/app/mobile/_components/support-chat";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { signedAvatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null };
type Appointment = { id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 1;

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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
        .select("id, full_name, role, avatar_path")
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
      void signedAvatarUrl(supabase, currentProfile.avatar_path).then((url) => { if (active) setPhotoUrl(url); });
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
  const pendingItems = pendingAppointments.slice(0, pendingPreviewLimit).map((appointment) => ({
    title: appointment.faculty_name || "Faculty",
    description: `${formatLongDate(appointment.preferred_date)} - ${formatTime(appointment.preferred_time)}`,
    status: "Pending",
    href: `/student/appointment-requests/${appointment.id}`,
  }));

  return (
    <MobileLayout className={styles.screen} role="student" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <NotificationBell href="/student/notifications" />
        </header>
        <div className={styles.greeting}>
          <ProfilePhoto inline src={photoUrl} />
          <div><strong>{getGreeting()}</strong><small>{profile?.full_name || "Student"}</small></div>
        </div>

        {nextAppointment ? (
          <SpotlightCard
            eyebrow="Up next"
            title={nextAppointment.faculty_name || "Faculty consultation"}
            details={[
              { icon: <CalendarDays size={13} />, text: formatLongDate(nextAppointment.preferred_date) },
              { icon: <Clock3 size={13} />, text: formatTime(nextAppointment.preferred_time) },
              { icon: <MapPin size={13} />, text: nextAppointment.meeting_location || "Location to be confirmed" },
            ]}
            href={`/student/appointment-requests/${nextAppointment.id}`}
            actionLabel="View details"
          />
        ) : (
          <SpotlightCard
            muted
            eyebrow="No upcoming consultation"
            title="Book a consultation"
            details={[{ icon: <UsersRound size={13} />, text: facultyCount === 1 ? "1 faculty member has open dates" : `${facultyCount} faculty members have open dates` }]}
            href="/student/faculty"
            actionLabel="Find faculty"
          />
        )}

        <LoginStreakCard role="student" />

        <h2 className={styles.sectionTitle}>
          Awaiting Response {pendingAppointments.length > 0 && <span className={styles.count}>{pendingAppointments.length}</span>}
          {pendingAppointments.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/student/appointment-requests?status=pending">See all</Link>}
        </h2>
        {pendingItems.length > 0 ? <CardList items={pendingItems} /> : <p className={styles.emptyState}>No requests are waiting on faculty.</p>}
        <SupportChat audience="student" variant="floating" />
      </div>
    </MobileLayout>
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
