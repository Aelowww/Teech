import Link from "next/link";
import { Bell, Building2, CalendarDays, Check, CheckCircle2, CircleAlert, Clock3, MapPin, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import { CancelAppointmentButton } from "@/app/mobile/_components/cancel-appointment-button";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled";

type Appointment = {
  id: string;
  appointment_code: string | null;
  faculty_name: string | null;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  details: string | null;
  meeting_location: string | null;
  status: AppointmentStatus;
  cancelled_by: string | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/student/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "student") redirect("/student/sign-in");

  const { data: appointment } = await supabase
    .from("appointment_requests")
    .select("id, appointment_code, faculty_name, preferred_date, preferred_time, reason, details, meeting_location, status, cancelled_by")
    .eq("id", id)
    .maybeSingle();
  if (!appointment) redirect("/student/appointment-requests");

  const request = appointment as Appointment;
  const copy = statusCopy(request.status, request.cancelled_by);
  const StatusIcon = request.status === "confirmed" ? CheckCircle2 : request.status === "pending" ? Clock3 : XCircle;

  return (
    <MobileLayout className={styles.screen} backTo="/student/appointment-requests" role="student" activeNav="requests">
      <div className={styles.page}>
        <div className={styles.statusMark}><StatusIcon size={34} /></div>
        <PageHeading title={copy.title} subtitle={copy.subtitle} />
        <StatusTimeline status={request.status} />
        <section className={styles.detailsCard}>
          <header><span>Appointment ID</span><strong>{request.appointment_code || request.id}</strong></header>
          <div className={styles.faculty}><span className={styles.initials}>{initialsFor(request.faculty_name)}</span><div><strong>{request.faculty_name || "Faculty member"}</strong><small>Consultation request</small></div></div>
          <dl>
            <div><CalendarDays size={15} /><dt>When</dt><dd>{formatDate(request.preferred_date)} - {formatTime(request.preferred_time)}</dd></div>
            <div><MapPin size={15} /><dt>Where</dt><dd>{request.meeting_location || "To be confirmed by faculty"}</dd></div>
            <div><CircleAlert size={15} /><dt>Status</dt><dd><span className={`${styles.statusPill} ${styles[`status${capitalize(request.status)}`]}`}>{capitalize(request.status)}</span></dd></div>
          </dl>
          <div className={styles.reason}><span>Reason</span><p>{request.reason}</p>{request.details && <small>{request.details}</small>}</div>
        </section>
        <aside className={styles.notice}><Bell size={16} /><span>Updates to this request will appear in Notifications.</span></aside>
        {(request.status === "pending" || request.status === "confirmed") && <CancelAppointmentButton appointmentId={request.id} role="student" />}
        <Link className={styles.homeButton} href="/student/home">Back to Home</Link>
      </div>
    </MobileLayout>
  );
}

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  const confirmed = status === "confirmed";
  return <div className={styles.timeline} aria-label={`Request status: ${status}`}>
    <div><span className={styles.complete}><Check size={13} /></span><small>Sent</small></div>
    <div><span className={status === "pending" ? styles.current : styles.complete}>{status === "pending" ? <Clock3 size={13} /> : <Check size={13} />}</span><small>Pending</small></div>
    <div><span className={confirmed ? styles.complete : ""}>{confirmed ? <Check size={13} /> : <Building2 size={13} />}</span><small>Confirmed</small></div>
  </div>;
}

function statusCopy(status: AppointmentStatus, cancelledBy: string | null) {
  if (status === "confirmed") return { title: "Consultation confirmed", subtitle: "Your faculty member has confirmed this appointment." };
  if (status === "declined") return { title: "Request declined", subtitle: "This consultation request was not approved." };
  if (status === "cancelled") return { title: "Request cancelled", subtitle: cancelledBy === "faculty" ? "Your faculty member cancelled this consultation." : "You cancelled this consultation request." };
  return { title: "Waiting for confirmation", subtitle: "We will notify you once your appointment has been confirmed." };
}

function initialsFor(name: string | null) { return (name || "Faculty").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function capitalize(value: AppointmentStatus) { return `${value[0].toUpperCase()}${value.slice(1)}`; }
