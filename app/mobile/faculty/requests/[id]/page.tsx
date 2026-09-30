import Link from "next/link";
import { Ban, Building2, CalendarDays, Check, CheckCircle2, CircleAlert, Clock3, MapPin, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import { RequestDecisionButtons } from "@/app/mobile/_components/request-decision-buttons";
import { CancelAppointmentButton } from "@/app/mobile/_components/cancel-appointment-button";
import { createClient } from "@/lib/supabase/server";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "@/app/mobile/student/appointment-requests/[id]/page.module.css";

type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled";

type Appointment = {
  id: string;
  appointment_code: string | null;
  student_name: string | null;
  student_number: string | null;
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
  if (!user) redirect("/faculty/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/faculty/sign-in");

  const { data: appointment } = await supabase
    .from("appointment_requests")
    .select("id, appointment_code, student_name, student_number, preferred_date, preferred_time, reason, details, meeting_location, status, cancelled_by")
    .eq("id", id)
    .eq("faculty_profile_id", profile.id)
    .maybeSingle();
  if (!appointment) redirect("/faculty/requests");

  const request = appointment as Appointment;
  const expired = request.status === "pending" && request.preferred_date < localDateValue();
  const copy = expired
    ? { title: "Request expired", subtitle: "This date has passed. You can decline it to clear it from your list." }
    : statusCopy(request.status, request.cancelled_by);
  const StatusIcon = request.status === "confirmed" ? CheckCircle2 : request.status === "pending" ? Clock3 : request.status === "cancelled" ? Ban : XCircle;

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/requests" role="faculty" activeNav="requests">
      <div className={styles.page}>
        <div className={styles.statusMark}><StatusIcon size={34} /></div>
        <PageHeading title={copy.title} subtitle={copy.subtitle} />
        <div className={styles.timeline} aria-label={`Request status: ${request.status}`}>
          <div><span className={styles.complete}><Check size={13} /></span><small>Received</small></div>
          <div><span className={request.status === "pending" ? styles.current : styles.complete}>{request.status === "pending" ? <Clock3 size={13} /> : <Check size={13} />}</span><small>Pending</small></div>
          <div><span className={request.status === "confirmed" ? styles.complete : ""}>{request.status === "confirmed" ? <Check size={13} /> : <Building2 size={13} />}</span><small>Confirmed</small></div>
        </div>
        <section className={styles.detailsCard}>
          <header><span>Appointment ID</span><strong>{request.appointment_code || request.id}</strong></header>
          <div className={styles.faculty}><span className={styles.initials}>{initialsFor(request.student_name)}</span><div><strong>{request.student_name || "Student"}</strong><small>{request.student_number ? `Student ID ${request.student_number}` : "Consultation request"}</small></div></div>
          <dl>
            <div><CalendarDays size={15} /><dt>When</dt><dd>{formatDate(request.preferred_date)} - {formatTime(request.preferred_time)}</dd></div>
            <div><MapPin size={15} /><dt>Where</dt><dd>{request.meeting_location || "No location set"}</dd></div>
            <div><CircleAlert size={15} /><dt>Status</dt><dd><span className={`${styles.statusPill} ${styles[`status${capitalize(request.status)}`]}`}>{capitalize(request.status)}</span></dd></div>
          </dl>
          <div className={styles.reason}><span>Reason</span><p>{request.reason}</p>{request.details && <small>{request.details}</small>}</div>
        </section>
        {request.status === "pending" && <RequestDecisionButtons requestId={request.id} canConfirm={!expired} />}
        {request.status === "confirmed" && <CancelAppointmentButton appointmentId={request.id} role="faculty" />}        <Link className={`${buttonStyles.button} ${buttonStyles.secondary} ${styles.homeButton}`} href="/faculty/requests">Back to Requests</Link>
      </div>
    </MobileLayout>
  );
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function statusCopy(status: AppointmentStatus, cancelledBy: string | null) {
  if (status === "confirmed") return { title: "Consultation confirmed", subtitle: "This consultation is on your schedule." };
  if (status === "declined") return { title: "Request declined", subtitle: "You declined this consultation request." };
  if (status === "cancelled") return { title: "Request cancelled", subtitle: cancelledBy === "system" ? "This request expired before you responded." : cancelledBy === "faculty" ? "You cancelled this consultation." : "The student cancelled this consultation." };
  return { title: "Needs your response", subtitle: "Confirm or decline this consultation request." };
}

function initialsFor(name: string | null) { return (name || "Student").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function capitalize(value: AppointmentStatus) { return `${value[0].toUpperCase()}${value.slice(1)}`; }
