"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, CalendarPlus, CheckCircle2, Eye, UserRound } from "lucide-react";
import { EmptyState, MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { ShowMoreButton, useShowMore } from "@/app/mobile/_components/show-more";
import styles from "./page.module.css";

type Appointment = {
  id: string;
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
  const statusFilter = searchParams.get("status") === "pending" ? "pending" : "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
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
        .select("id, faculty_name, preferred_date, preferred_time, reason, status")
        .eq("student_profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (requestError) setError(requestError.message);
      else setAppointments(data as Appointment[] || []);
      setIsLoading(false);

      channel = supabase
        .channel(`student-requests-${profile.id}`)
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
    void loadAppointments();
    return () => {
      active = false;
      if (channel) void createClient().removeChannel(channel);
    };
  }, [router]);

  const filteredAppointments = statusFilter ? appointments.filter((appointment) => appointment.status === statusFilter) : appointments;
  const list = useShowMore(filteredAppointments);

  if (isLoading) return <AppLoader />;

  async function cancelRequest(id: string) {
    const { data: cancelled, error: cancelError } = await createClient()
      .from("appointment_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .in("status", ["pending", "confirmed"])
      .select("id");
    if (cancelError) return cancelError.message;
    if (!cancelled?.length) return "This request can no longer be cancelled.";
    setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status: "cancelled" } : appointment));
  }

  const cancellingAppointment = appointments.find((appointment) => appointment.id === cancellingId);

  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title={statusFilter ? "Pending Requests" : "Requests"} subtitle={statusFilter ? "Review consultation requests waiting for a response." : "Manage your consultation requests."} />
        {error && <Notice error>{error}</Notice>}
        {filteredAppointments.length > 0 ? (
          <div className={styles.requests}>
            {list.visible.map((appointment) => (
              <article className={styles.requestCard} key={appointment.id}>
                <div className={styles.requestIcon} aria-label="Faculty profile"><UserRound size={18} /></div>
                <div className={styles.requestContent}>
                  <strong>{appointment.faculty_name || "Faculty"}</strong>
                  <span>{formatDate(appointment.preferred_date)} at {formatTime(appointment.preferred_time)}</span>
                  <small>{appointment.reason}</small>
                  <em className={styles[`status${capitalize(appointment.status)}`]}>{appointment.status === "pending" && isPastDate(appointment.preferred_date) ? "expired" : appointment.status}</em>
                </div>
                <div className={styles.cardActions}>
                  <Link className={styles.viewButton} href={`/student/appointment-requests/${appointment.id}`}><Eye size={14} /><span>View</span></Link>
                  <button type="button" className={styles.cancelButton} onClick={() => setCancellingId(appointment.id)} disabled={appointment.status !== "pending" && appointment.status !== "confirmed"}><Ban size={12} />Cancel</button>
                </div>
              </article>
            ))}
            <ShowMoreButton remaining={list.remaining} canCollapse={list.canCollapse} onShowMore={list.showMore} onShowLess={list.showLess} />
          </div>
        ) : statusFilter
          ? <EmptyState icon={<CheckCircle2 size={30} />} title="You're all caught up" description="None of your requests are waiting on a faculty response right now." action={{ label: "View all requests", href: "/student/appointment-requests" }} />
          : <EmptyState icon={<CalendarPlus size={30} />} title="No consultations yet" description="Stuck on a lesson, project, or thesis? Book a one-on-one consultation with a faculty member." action={{ label: "Book a consultation", href: "/student/faculty" }} />}
      </div>
      <ConfirmationModal open={Boolean(cancellingId)} title="Cancel consultation?" description={cancellingAppointment?.status === "confirmed" ? "This will cancel your confirmed consultation and notify the faculty member." : "This will cancel your pending consultation request and notify the faculty member."} confirmLabel="Cancel Consultation" tone="danger" onCancel={() => setCancellingId("")} onConfirm={() => cancelRequest(cancellingId)} />
    </MobileLayout>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(value: string) {
  return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function capitalize(value: string) {
  return `${value[0].toUpperCase()}${value.slice(1)}` as "Pending" | "Confirmed" | "Declined" | "Cancelled";
}

function isPastDate(value: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value < today;
}
