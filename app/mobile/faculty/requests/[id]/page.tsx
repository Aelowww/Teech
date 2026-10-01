import Image from "next/image";
import type { CSSProperties } from "react";
import { Ban, CalendarDays, Check, CheckCircle2, Clock3, FileText, Hash, MapPin, X, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { MobileLayout } from "@/app/mobile/_components/ui";
import { RequestDecisionButtons } from "@/app/mobile/_components/request-decision-buttons";
import { CancelAppointmentButton } from "@/app/mobile/_components/cancel-appointment-button";
import { createClient } from "@/lib/supabase/server";
import { studentAvatarUrls } from "@/lib/avatar";
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
  const photoUrl = (await studentAvatarUrls(supabase, [request.id])).get(request.id);
  const expired = request.status === "pending" && request.preferred_date < localDateValue();
  const copy = expired
    ? { title: "Request expired", subtitle: "This date has passed. You can decline it to clear it from your list." }
    : statusCopy(request.status, request.cancelled_by);
  const StatusIcon = request.status === "confirmed" ? CheckCircle2 : request.status === "pending" ? Clock3 : request.status === "cancelled" ? Ban : XCircle;

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/requests" role="faculty" activeNav="requests">
      <div className={styles.page}>
        <header className={styles.hero}>
          <span className={`${styles.statusMark} ${styles[request.status]}`}><StatusIcon size={26} aria-hidden="true" /></span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </header>

        <StatusTimeline status={request.status} />

        <div className={styles.faculty}>
          <span className={styles.avatar}>
            {photoUrl
              ? <Image src={photoUrl} alt="" fill sizes="48px" unoptimized />
              : initialsFor(request.student_name)}
          </span>
          <div>
            <strong>{request.student_name || "Student"}</strong>
            <small>{request.student_number ? `Student ID ${request.student_number}` : "Consultation request"}</small>
          </div>
        </div>

        <dl className={styles.details}>
          <div>
            <dt><CalendarDays size={16} aria-hidden="true" />When</dt>
            <dd>{formatDate(request.preferred_date)} · {formatTime(request.preferred_time)}</dd>
          </div>
          <div>
            <dt><MapPin size={16} aria-hidden="true" />Where</dt>
            <dd className={request.meeting_location ? "" : styles.muted}>{request.meeting_location || "No location set"}</dd>
          </div>
          <div>
            <dt><FileText size={16} aria-hidden="true" />Reason</dt>
            <dd>
              {request.reason}
              {request.details && <small>{request.details}</small>}
            </dd>
          </div>
          <div>
            <dt><Hash size={16} aria-hidden="true" />Reference</dt>
            <dd className={styles.code}>{request.appointment_code || request.id}</dd>
          </div>
        </dl>

        {(request.status === "pending" || request.status === "confirmed") && (
          <div className={styles.actions}>
            {request.status === "pending" && <RequestDecisionButtons requestId={request.id} canConfirm={!expired} />}
<<<<<<< HEAD
            {request.status === "confirmed" && <CancelAppointmentButton appointmentId={request.id} role="faculty" />}
=======
            {request.status === "confirmed" && <CancelAppointmentButton appointmentId={request.id} role="faculty" quiet />}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  const closed = status === "declined" || status === "cancelled";
  const steps = [
    { label: "Received", state: "done" },
    { label: "Pending", state: status === "pending" ? "current" : "done" },
    { label: closed ? capitalize(status) : "Confirmed", state: status === "confirmed" ? "done" : closed ? "stopped" : "next" },
  ] as const;
  const progress = status === "pending" ? 0.5 : 1;
  return (
    <ol className={styles.timeline} style={{ "--progress": progress } as CSSProperties} aria-label={`Request status: ${status}`}>
      {steps.map((step) => (
        <li key={step.label} className={styles[step.state]}>
          <span>
            {step.state === "done" && <Check size={12} strokeWidth={3} aria-hidden="true" />}
            {step.state === "stopped" && <X size={12} strokeWidth={3} aria-hidden="true" />}
          </span>
          <small>{step.label}</small>
        </li>
      ))}
    </ol>
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
