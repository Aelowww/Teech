"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, MapPin, UserRound, UsersRound } from "lucide-react";
import { AppShell } from "@/app/desktop/_components/app-shell";
import { ProfilePhoto, SpotlightCard } from "@/app/desktop/_components/ui";
import { LoginStreakCard } from "@/app/desktop/_components/login-streak";
import { FactCard } from "@/app/desktop/_components/fact-card";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { facultyAvatarUrls, signedAvatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null; course_year: string | null };
type Appointment = { id: string; faculty_profile_id: string; faculty_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 3;
const upcomingLimit = 4;

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
  const confirmed = upcoming
    .filter((appointment) => appointment.status === "confirmed")
    .sort((first, second) => `${first.preferred_date}T${first.preferred_time}`.localeCompare(`${second.preferred_date}T${second.preferred_time}`));
  const nextAppointment = confirmed[0];
  const upcomingConfirmed = confirmed.slice(1);
  const fullName = profile?.full_name || "Student";

  return (
    <AppShell
      role="student"
      active="home"
      name={fullName}
      subtitle={profile?.course_year ? `Student • ${profile.course_year}` : "Student"}
      avatarSrc={photoUrl}
    >
      <div className={styles.dashboard}>
        <div className={styles.center}>
          <section className={styles.hero}>
            <ProfilePhoto inline src={photoUrl} />
            <div className={styles.heroCopy}>
              <h1>{getGreeting()}</h1>
              <p>{fullName}</p>
            </div>
          </section>

          {nextAppointment ? (
            <SpotlightCard
              eyebrow={nextAppointment.preferred_date === localDateValue() ? "Up next · Today" : "Up next"}
              title={nextAppointment.faculty_name || "Faculty consultation"}
              details={[
                { icon: <CalendarDays size={15} />, text: formatLongDate(nextAppointment.preferred_date) },
                { icon: <Clock3 size={15} />, text: formatTime(nextAppointment.preferred_time) },
                { icon: <MapPin size={15} />, text: nextAppointment.meeting_location || "Location to be confirmed" },
              ]}
              href={`/student/appointment-requests/${nextAppointment.id}`}
              avatar={facultyPhotos.get(nextAppointment.faculty_profile_id) ?? null}
              actionLabel="View details"
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

          <FactCard role="student" />

          {upcomingConfirmed.length > 0 && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Upcoming consultations</h2>
                <Link className={styles.seeAll} href="/student/appointment-requests?status=confirmed">See all</Link>
              </div>
              <div className={styles.requestList}>
                {upcomingConfirmed.slice(0, upcomingLimit).map((appointment) => (
                  <Link className={styles.requestRow} href={`/student/appointment-requests/${appointment.id}`} key={appointment.id}>
                    <FacultyPhoto src={facultyPhotos.get(appointment.faculty_profile_id)} />
                    <div><strong>{appointment.faculty_name || "Faculty"}</strong><small>{formatLongDate(appointment.preferred_date)} • {formatTime(appointment.preferred_time)}</small></div>
                    <span className={styles.rowMeta}><MapPin size={14} />{appointment.meeting_location || "Location to be confirmed"}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className={styles.side}>
          <LoginStreakCard role="student" />

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Awaiting Response</h2>
              {pendingAppointments.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/student/appointment-requests?status=pending">See all</Link>}
            </div>
            {pendingAppointments.length > 0 ? (
              <div className={styles.requestList}>
                {pendingAppointments.slice(0, pendingPreviewLimit).map((appointment) => (
                  <Link className={styles.requestRow} href={`/student/appointment-requests/${appointment.id}`} key={appointment.id}>
                    <FacultyPhoto src={facultyPhotos.get(appointment.faculty_profile_id)} />
                    <div><strong>{appointment.faculty_name || "Faculty"}</strong><small>{formatLongDate(appointment.preferred_date)} • {formatTime(appointment.preferred_time)}</small></div>
                    <em>Pending</em>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No requests are waiting on faculty.</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function FacultyPhoto({ src }: { src?: string }) {
  return (
    <span className={styles.personIcon}>
      {src ? <Image className={styles.personImage} src={src} alt="" fill sizes="40px" unoptimized /> : <UserRound size={20} />}
    </span>
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
