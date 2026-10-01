"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import { EmptyState, DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";
import { avatarBucket } from "@/lib/avatar";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ShowMoreButton, useShowMore } from "@/app/desktop/_components/show-more";
import { matchesTab, parseTab, RequestTabs, type RequestTab } from "@/app/desktop/_components/request-tabs";
import styles from "./page.module.css";

type Appointment = {
  id: string;
  faculty_profile_id: string | null;
  faculty_name: string | null;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RequestsPage />
    </Suspense>
  );
}

function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<RequestTab>(() => parseTab(searchParams.get("status")));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    async function loadAppointments() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) router.replace("/student/sign-in");
        return;
      }
      if (!active) return;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (profileError || !profile) {
        if (active) {
          setError("Your profile could not be loaded.");
          setIsLoading(false);
        }
        return;
      }
      const { data, error: requestError } = await supabase
        .from("appointment_requests")
        .select("id, faculty_profile_id, faculty_name, preferred_date, preferred_time, reason, status")
        .eq("student_profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (requestError) setError(requestError.message);
      else setAppointments(data as Appointment[] || []);
      setIsLoading(false);
      if (data?.length) void loadPhotos(supabase, data as Appointment[]);

      channel = supabase
        .channel(uniqueChannelName(`student-requests-${profile.id}`))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointment_requests", filter: `student_profile_id=eq.${profile.id}` },
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
    async function loadPhotos(supabase: ReturnType<typeof createClient>, rows: Appointment[]) {
      const facultyIds = [...new Set(rows.map((row) => row.faculty_profile_id).filter((id): id is string => Boolean(id)))];
      if (!facultyIds.length) return;
      const { data: faculty } = await supabase.from("profiles").select("id, avatar_path").in("id", facultyIds).not("avatar_path", "is", null);
      const withPhotos = (faculty || []) as { id: string; avatar_path: string }[];
      if (!withPhotos.length) return;
      const { data: signed } = await supabase.storage.from(avatarBucket).createSignedUrls(withPhotos.map((profile) => profile.avatar_path), 60 * 60);
      const urlByPath = new Map((signed || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
      const next = new Map<string, string>();
      for (const profile of withPhotos) {
        const url = urlByPath.get(profile.avatar_path);
        if (url) next.set(profile.id, url);
      }
      if (active) setPhotos(next);
    }

    void loadAppointments();
    return () => {
      active = false;
      if (channel) void createClient().removeChannel(channel);
    };
  }, [router]);

  const filteredAppointments = appointments.filter((appointment) => matchesTab(appointment.status, tab));
  const list = useShowMore(filteredAppointments);

  if (isLoading) return <AppLoader />;

  return (
    <DesktopLayout className={styles.screen} role="student" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title="Requests" subtitle="Manage your consultation requests." />
        {appointments.length > 0 && <RequestTabs statuses={appointments.map((appointment) => appointment.status)} active={tab} onChange={setTab} />}
        {error && <Notice error>{error}</Notice>}
        {filteredAppointments.length > 0 ? (
          <div className={styles.requests}>
            <ul className={styles.list}>
              {list.visible.map((appointment) => {
                const status = appointment.status === "pending" && isPastDate(appointment.preferred_date) ? "expired" : appointment.status;
                const date = new Date(`${appointment.preferred_date}T00:00:00`);
                const photo = appointment.faculty_profile_id ? photos.get(appointment.faculty_profile_id) : undefined;
                const closed = status !== "pending" && status !== "confirmed";
                return (
                  <li key={appointment.id}>
                    <Link className={`${styles.row} ${closed ? styles.rowClosed : ""}`} href={`/student/appointment-requests/${appointment.id}`}>
                      <span className={styles.avatar} aria-hidden="true">
                        {photo
                          ? <Image src={photo} alt="" fill sizes="44px" unoptimized />
                          : <UserRound size={20} />}
                      </span>
                      <span className={styles.info}>
                        <strong>{appointment.faculty_name || "Faculty"}</strong>
                        <span>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {formatTime(appointment.preferred_time)}</span>
                        <small>{appointment.reason}</small>
                      </span>
                      <em className={`${styles.status} ${styles[status]}`}>{status}</em>
                      <ChevronRight className={styles.chevron} size={16} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ShowMoreButton remaining={list.remaining} canCollapse={list.canCollapse} onShowMore={list.showMore} onShowLess={list.showLess} />
          </div>
        ) : tab === "pending"
          ? <EmptyState scene="done" title="You're all caught up" description="None of your requests are waiting on a faculty response right now." action={{ label: "Book a consultation", href: "/student/faculty" }} />
          : tab === "confirmed"
            ? <EmptyState scene="calendar" title="No confirmed consultations" description="Once a faculty member confirms a request, it will show up here." action={{ label: "Book a consultation", href: "/student/faculty" }} />
            : tab === "closed"
              ? <EmptyState scene="inbox" title="Nothing closed yet" description="Declined and cancelled requests will show up here." action={{ label: "Book a consultation", href: "/student/faculty" }} />
              : <EmptyState scene="calendar" title="No consultations yet" description="Stuck on a lesson, project, or thesis? Book a one-on-one consultation with a faculty member." action={{ label: "Book a consultation", href: "/student/faculty" }} />}
      </div>
    </DesktopLayout>
  );
}

function formatTime(value: string) {
  return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isPastDate(value: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value < today;
}
