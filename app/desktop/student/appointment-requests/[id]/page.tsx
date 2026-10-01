import Image from "next/image";
import type { CSSProperties } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, FileText, Hash, MapPin, UserRound, X, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { DesktopLayout } from "@/app/desktop/_components/ui";
import { CancelAppointmentButton } from "@/app/desktop/_components/cancel-appointment-button";
import { createClient } from "@/lib/supabase/server";
import { avatarBucket } from "@/lib/avatar";
import styles from "./page.module.css";

type AppointmentStatus = "pending" | "confirmed" | "declined" | "cancelled";

type Appointment = {
  id: string;
  appointment_code: string | null;
  faculty_profile_id: string | null;
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

<<<<<<< HEAD
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "student") redirect("/student/sign-in");

  const { data: appointment } = await supabase
    .from("appointment_requests")
    .select("id, appointment_code, faculty_profile_id, faculty_name, preferred_date, preferred_time, reason, details, meeting_location, status, cancelled_by")
    .eq("id", id)
    .maybeSingle();
=======
  const [{ data: profile }, { data: appointment }] = await Promise.all([
    supabase.from("profiles").select("role").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("appointment_requests")
      .select("id, appointment_code, faculty_profile_id, faculty_name, preferred_date, preferred_time, reason, details, meeting_location, status, cancelled_by")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!profile || profile.role !== "student") redirect("/student/sign-in");
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
  if (!appointment) redirect("/student/appointment-requests");

  const request = appointment as Appointment;
  const photoUrl = await facultyPhoto(supabase, request.faculty_profile_id);
  const copy = statusCopy(request.status, request.cancelled_by);
  const closed = request.status === "declined" || request.status === "cancelled";
  const StatusIcon = request.status === "confirmed" ? CheckCircle2 : request.status === "pending" ? Clock3 : XCircle;

  return (
    <DesktopLayout className={styles.screen} backTo="/student/appointment-requests" role="student" activeNav="requests">
      <div className={styles.page}>
        <aside className={styles.statusCard}>
          <header className={styles.hero}>
            <span className={`${styles.statusMark} ${styles[request.status]}`}><StatusIcon size={26} aria-hidden="true" /></span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </header>

          <StatusTimeline status={request.status} />

          {!closed && (
            <div className={styles.actions}>
              <CancelAppointmentButton appointmentId={request.id} role="student" quiet />
            </div>
          )}
        </aside>

        <section className={styles.infoCard}>
        <div className={styles.faculty}>
          <span className={styles.avatar}>
            {photoUrl
              ? <Image src={photoUrl} alt="" fill sizes="48px" unoptimized />
              : <UserRound size={22} aria-hidden="true" />}
          </span>
          <div>
            <strong>{request.faculty_name || "Faculty member"}</strong>
            <small>Consultation request</small>
          </div>
        </div>

        <dl className={styles.details}>
          <div>
            <dt><CalendarDays size={16} aria-hidden="true" />When</dt>
            <dd>{formatDate(request.preferred_date)} · {formatTime(request.preferred_time)}</dd>
          </div>
          <div>
            <dt><MapPin size={16} aria-hidden="true" />Where</dt>
            <dd className={request.meeting_location ? "" : styles.muted}>{request.meeting_location || "To be confirmed by faculty"}</dd>
          </div>
          <div className={styles.wide}>
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
        </section>
      </div>
    </DesktopLayout>
  );
}

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  const closed = status === "declined" || status === "cancelled";
  const steps = [
    { label: "Sent", state: "done" },
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

async function facultyPhoto(supabase: Awaited<ReturnType<typeof createClient>>, facultyId: string | null) {
  if (!facultyId) return null;
  const { data: faculty } = await supabase.from("profiles").select("avatar_path").eq("id", facultyId).maybeSingle();
  if (!faculty?.avatar_path) return null;
  const { data } = await supabase.storage.from(avatarBucket).createSignedUrl(faculty.avatar_path, 60 * 60);
  return data?.signedUrl || null;
}

function statusCopy(status: AppointmentStatus, cancelledBy: string | null) {
  if (status === "confirmed") return { title: "Consultation confirmed", subtitle: "Your faculty member has confirmed this appointment." };
  if (status === "declined") return { title: "Request declined", subtitle: "This consultation request was not approved." };
  if (status === "cancelled") return { title: "Request cancelled", subtitle: cancelledBy === "system" ? "This request expired without a response from your faculty member." : cancelledBy === "faculty" ? "Your faculty member cancelled this consultation." : "You cancelled this consultation request." };
  return { title: "Waiting for confirmation", subtitle: "We'll notify you once your faculty member confirms." };
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function capitalize(value: AppointmentStatus) { return `${value[0].toUpperCase()}${value.slice(1)}`; }
