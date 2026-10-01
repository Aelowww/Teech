"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import { MobileLayout, BrandLogo, CardList, EmptyState, ProfilePhoto, SpotlightCard, UpNextCard } from "@/app/mobile/_components/ui";
import { NotificationBell } from "@/app/mobile/_components/notification-bell";
import { LoginStreakCard } from "@/app/mobile/_components/login-streak";
import { FactCard } from "@/app/mobile/_components/fact-card";
import { RecoveryReminder } from "@/app/mobile/_components/recovery-reminder";
import { SupportChat } from "@/app/mobile/_components/support-chat";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";
import { facultyAvatarUrls, signedAvatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";
import { AppLoader } from "@/app/mobile/_components/app-loader";

type Profile = { id: string; full_name: string; avatar_path: string | null };
type Appointment = { id: string; faculty_profile_id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 1;

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
        .select("id, full_name, role, avatar_path")
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
  const nextAppointment = upcoming
    .filter((appointment) => appointment.status === "confirmed")
    .sort((first, second) => `${first.preferred_date}T${first.preferred_time}`.localeCompare(`${second.preferred_date}T${second.preferred_time}`))[0];
  const pendingItems = pendingAppointments.slice(0, pendingPreviewLimit).map((appointment) => ({
    title: appointment.faculty_name || "Faculty",
    description: `${formatLongDate(appointment.preferred_date)} - ${formatTime(appointment.preferred_time)}`,
    status: "Pending",
    imageUrl: facultyPhotos.get(appointment.faculty_profile_id),
    href: `/student/appointment-requests/${appointment.id}`,
  }));

  return (
    <MobileLayout className={styles.screen} role="student" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <div className={styles.headerActions}><FactCard role="student" /><NotificationBell href="/student/notifications" /></div>
        </header>
        <div className={styles.greeting}>
          <ProfilePhoto inline small src={photoUrl} />
          <div><small>{getGreeting()}</small><strong>{profile?.full_name || "Student"}</strong></div>
        </div>
        <RecoveryReminder />

        {nextAppointment ? (
          <UpNextCard
            eyebrow="Up next"
            title={nextAppointment.faculty_name || "Faculty consultation"}
            date={nextAppointment.preferred_date}
            meta={[formatTime(nextAppointment.preferred_time), nextAppointment.meeting_location || "Location to be confirmed"]}
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
        {pendingItems.length > 0 ? <CardList items={pendingItems} /> : <EmptyState compact scene="done" title="No requests are waiting on faculty." action={{ label: "Book a consultation", href: "/student/faculty" }} />}
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
