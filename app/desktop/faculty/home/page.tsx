"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, CalendarDays, CheckCircle2, ChevronRight, Inbox } from "lucide-react";
import { DesktopLayout, CardList, ProfilePhoto, UpNextCard } from "@/app/desktop/_components/ui";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import { LoginStreakCard } from "@/app/desktop/_components/login-streak";
import { FactCard } from "@/app/desktop/_components/fact-card";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";
import { signedAvatarUrl, studentAvatarUrls } from "@/lib/avatar";
import { PresenceSelect, type PresenceStatus } from "./presence-select";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null; presence_status: PresenceStatus | null };
type Request = { id: string; student_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 1;

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [studentPhotos, setStudentPhotos] = useState<Map<string, string>>(() => new Map());
  const [openDates, setOpenDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presence, setPresence] = useState<PresenceStatus>("available");
  const [presenceError, setPresenceError] = useState("");

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      const { data: currentProfile } = await supabase.from("profiles").select("id, full_name, role, avatar_path, presence_status").eq("auth_user_id", user.id).maybeSingle();
      if (!currentProfile || currentProfile.role !== "faculty") { await supabase.auth.signOut(); router.replace("/faculty/sign-in"); return; }
      const [requestsResult, availabilityResult] = await Promise.all([
        supabase.from("appointment_requests").select("id, student_name, preferred_date, preferred_time, reason, status, meeting_location").eq("faculty_profile_id", currentProfile.id).in("status", ["pending", "confirmed"]).gte("preferred_date", localDateValue()).order("preferred_date").order("preferred_time"),
        supabase.from("faculty_availability").select("available_date").eq("faculty_profile_id", currentProfile.id).eq("is_available", true).gte("available_date", localDateValue()).order("available_date"),
      ]);
      if (!active) return;
      setProfile(currentProfile);
      setPresence(currentProfile.presence_status || "available");
      void signedAvatarUrl(supabase, currentProfile.avatar_path).then((url) => { if (active) setPhotoUrl(url); });
      setRequests(requestsResult.data as Request[] || []);
      if (requestsResult.data?.length) void studentAvatarUrls(supabase, requestsResult.data.map((request) => request.id)).then((urls) => { if (active) setStudentPhotos(urls); });
      setOpenDates([...new Set((availabilityResult.data || []).map((slot) => slot.available_date as string))]);
      setIsLoading(false);

      channel = supabase
        .channel(uniqueChannelName(`faculty-dashboard-${currentProfile.id}`))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointment_requests", filter: `faculty_profile_id=eq.${currentProfile.id}` },
          (payload) => {
            const changedRequest = payload.new as Request;
            setRequests((current) => {
              if (payload.eventType === "INSERT") return [...current, changedRequest];
              return current.map((request) => request.id === changedRequest.id ? { ...request, ...changedRequest } : request);
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

  async function changePresence(next: PresenceStatus) {
    if (!profile || next === presence) return;
    const previous = presence;
    setPresence(next);
    setPresenceError("");
    const { error } = await createClient().from("profiles").update({ presence_status: next }).eq("id", profile.id);
    if (error) { setPresence(previous); setPresenceError("Your status could not be updated. Try again."); }
  }

  const now = localDateTimeValue();
  const upcoming = requests
    .filter((request) => `${request.preferred_date}T${request.preferred_time}` >= now)
    .sort((first, second) => `${first.preferred_date}T${first.preferred_time}`.localeCompare(`${second.preferred_date}T${second.preferred_time}`));
  const pending = upcoming.filter((request) => request.status === "pending");
  const confirmed = upcoming.filter((request) => request.status === "confirmed");
  const nextConsultation = confirmed[0];
  const pendingItems = pending.slice(0, pendingPreviewLimit).map((request) => ({
    title: request.student_name || "Student",
    description: `${formatDate(request.preferred_date)} - ${formatTime(request.preferred_time)}${request.reason ? ` · ${request.reason}` : ""}`,
    status: "Pending",
    imageUrl: studentPhotos.get(request.id),
    href: `/faculty/requests/${request.id}`,
  }));

  return (
    <DesktopLayout className={styles.screen} role="faculty" activeNav="home">
      <header className={styles.header}>
        <div className={styles.greeting}>
          <ProfilePhoto inline small src={photoUrl} />
          <div className={styles.greetingText}><small>{getGreeting()}</small><strong>{profile?.full_name || "Faculty"}</strong></div>
          <div className={styles.presence}>
            <PresenceSelect value={presence} onChange={(next) => void changePresence(next)} />
            {presenceError && <p className={styles.presenceError}>{presenceError}</p>}
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <FactCard role="faculty" compact />
          {nextConsultation ? (
            <UpNextCard
              eyebrow="Up next"
              title={nextConsultation.student_name || "Student consultation"}
              date={nextConsultation.preferred_date}
              meta={[formatTime(nextConsultation.preferred_time), nextConsultation.meeting_location || "Location to be confirmed"]}
              href={`/faculty/requests/${nextConsultation.id}`}
              actionLabel="View details"
              avatar={studentPhotos.get(nextConsultation.id) ?? null}
            />
          ) : (
            <section className={styles.schedule} aria-label="Your schedule">
              <div className={styles.scheduleHead}>
                <div className={styles.scheduleText}>
                  <small>Your schedule</small>
                  <strong>No consultations booked yet</strong>
                  <p>{pending.length
                    ? `${pending.length} ${pending.length === 1 ? "request is" : "requests are"} waiting for your response.`
                    : openDates.length ? "Students can book any of your open dates." : "Publish dates so students can book you."}</p>
                </div>
                <Link className={`${buttonStyles.button} ${buttonStyles.primary}`} href="/faculty/availability">Manage availability<ChevronRight size={15} /></Link>
              </div>
              <div className={styles.scheduleStats}>
                <Link className={styles.stat} href="/faculty/availability">
                  <span className={`${styles.statIcon} ${styles.statViolet}`}><CalendarCheck2 size={18} aria-hidden="true" /></span>
                  <strong>{openDates.length}</strong>
                  <small>Open {openDates.length === 1 ? "date" : "dates"}</small>
                </Link>
                <Link className={styles.stat} href="/faculty/calendar">
                  <span className={`${styles.statIcon} ${styles.statGreen}`}><CalendarDays size={18} aria-hidden="true" /></span>
                  <strong>{openDates.length ? formatDate(openDates[0]) : "None yet"}</strong>
                  <small>Next open day</small>
                </Link>
                <Link className={styles.stat} href="/faculty/requests">
                  <span className={`${styles.statIcon} ${styles.statAmber}`}><Inbox size={18} aria-hidden="true" /></span>
                  <strong>{pending.length}</strong>
                  <small>Pending {pending.length === 1 ? "request" : "requests"}</small>
                </Link>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Needs Your Response {pending.length > 0 && <span className={styles.count}>{pending.length}</span>}
              {pending.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/faculty/requests">See all</Link>}
            </h2>
            {pendingItems.length
              ? <CardList items={pendingItems} />
              : <p className={styles.caughtUp}><CheckCircle2 size={18} aria-hidden="true" />You&apos;re all caught up. New requests will appear here.</p>}
          </section>
        </div>

        <aside className={styles.rail}>
          <LoginStreakCard role="faculty" />
          {nextConsultation && openDates.length > 0 && (
            <Link className={styles.availability} href="/faculty/availability">
              <CalendarCheck2 size={20} />
              <div>
                <strong>{openDates.length} open {openDates.length === 1 ? "date" : "dates"} for booking</strong>
                <small><CalendarDays size={12} /> Next open: {formatDate(openDates[0])}</small>
              </div>
              <ChevronRight size={16} />
            </Link>
          )}
        </aside>
      </div>
    </DesktopLayout>
  );
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
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
