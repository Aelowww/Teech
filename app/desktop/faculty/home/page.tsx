"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, CalendarDays, CalendarPlus, ChevronRight, Clock3, Inbox, MapPin } from "lucide-react";
import { DesktopLayout, CardList, ProfilePhoto, SpotlightCard } from "@/app/desktop/_components/ui";
import { LoginStreakCard } from "@/app/desktop/_components/login-streak";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { signedAvatarUrl } from "@/lib/avatar";
import { PresenceSelect, type PresenceStatus } from "./presence-select";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string; avatar_path: string | null; presence_status: PresenceStatus | null };
type Request = { id: string; student_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string; meeting_location: string | null };

const pendingPreviewLimit = 4;

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
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
      setOpenDates([...new Set((availabilityResult.data || []).map((slot) => slot.available_date as string))]);
      setIsLoading(false);

      channel = supabase
        .channel(`faculty-dashboard-${currentProfile.id}`)
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
    href: `/faculty/requests/${request.id}`,
  }));

  return (
    <DesktopLayout className={styles.screen} role="faculty" activeNav="home">
      <section className={styles.hero}>
        <ProfilePhoto inline src={photoUrl} />
        <div className={styles.greetingText}>
          <h1>{getGreeting()} {profile?.full_name?.split(" ")[0] || "Faculty"}</h1>
          <p>Here&apos;s what&apos;s happening with your consultations.</p>
        </div>
        <div className={styles.presence}>
          <small>Your status</small>
          <PresenceSelect value={presence} onChange={(next) => void changePresence(next)} />
          {presenceError && <p className={styles.presenceError}>{presenceError}</p>}
        </div>
      </section>

      <section className={styles.stats} aria-label="Summary">
        <Link className={`${styles.stat} ${styles.statPending}`} href="/faculty/requests"><small>Pending requests</small><strong>{pending.length}</strong></Link>
        <Link className={`${styles.stat} ${styles.statConfirmed}`} href="/faculty/requests"><small>Upcoming consultations</small><strong>{confirmed.length}</strong></Link>
        <Link className={styles.stat} href="/faculty/availability"><small>Open dates</small><strong>{openDates.length}</strong></Link>
      </section>

      <div className={styles.dashboard}>
        <div className={styles.mainColumn}>
          {nextConsultation ? (
            <SpotlightCard
              eyebrow={nextConsultation.preferred_date === localDateValue() ? "Up next · Today" : "Up next"}
              title={nextConsultation.student_name || "Student consultation"}
              details={[
                { icon: <CalendarDays size={15} />, text: formatLongDate(nextConsultation.preferred_date) },
                { icon: <Clock3 size={15} />, text: formatTime(nextConsultation.preferred_time) },
                { icon: <MapPin size={15} />, text: nextConsultation.meeting_location || "Location to be confirmed" },
              ]}
              href={`/faculty/requests/${nextConsultation.id}`}
              actionLabel="View details"
            />
          ) : (
            <SpotlightCard
              muted
              eyebrow="No upcoming consultation"
              title={pending.length ? "Review your requests" : "Open dates for booking"}
              details={[{ icon: <Inbox size={15} />, text: pending.length ? `${pending.length} ${pending.length === 1 ? "request is" : "requests are"} waiting for you` : "Students can book once you publish dates" }]}
              href={pending.length ? "/faculty/requests" : "/faculty/availability"}
              actionLabel={pending.length ? "View requests" : "Manage availability"}
            />
          )}

          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              Needs Your Response {pending.length > 0 && <span className={styles.count}>{pending.length}</span>}
              {pending.length > pendingPreviewLimit && <Link className={styles.seeAll} href="/faculty/requests">See all<ChevronRight size={15} /></Link>}
            </h2>
            {pendingItems.length ? <CardList items={pendingItems} /> : <p className={styles.emptyState}>You&apos;re all caught up.</p>}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <LoginStreakCard role="faculty" />

          {openDates.length > 0 ? (
            <Link className={styles.availability} href="/faculty/availability">
              <CalendarCheck2 size={20} />
              <div>
                <strong>{openDates.length} open {openDates.length === 1 ? "date" : "dates"} for booking</strong>
                <small><CalendarDays size={12} /> Next open: {formatDate(openDates[0])}</small>
              </div>
              <ChevronRight size={16} />
            </Link>
          ) : (
            <Link className={`${styles.availability} ${styles.availabilityEmpty}`} href="/faculty/availability">
              <CalendarPlus size={20} />
              <div>
                <strong>Publish your availability</strong>
                <small>Students can book once you add open dates.</small>
              </div>
              <ChevronRight size={16} />
            </Link>
          )}

          <section className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <Link href="/faculty/availability"><CalendarPlus size={16} />Manage availability</Link>
            <Link href="/faculty/calendar"><CalendarDays size={16} />Open calendar</Link>
            <Link href="/faculty/requests"><Inbox size={16} />All requests</Link>
          </section>
        </aside>
      </div>
    </DesktopLayout>
  );
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
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
