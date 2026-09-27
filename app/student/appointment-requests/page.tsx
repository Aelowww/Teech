"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserRound, X } from "lucide-react";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/components/app-loader";
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
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") === "pending" ? "pending" : "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAppointments() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
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
    }
    void loadAppointments();
    return () => { active = false; };
  }, []);

  if (isLoading) return <AppLoader />;

  async function cancelRequest(id: string) {
    const { error: cancelError } = await createClient()
      .from("appointment_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (cancelError) return cancelError.message;
    setAppointments((current) => current.map((appointment) => appointment.id === id ? { ...appointment, status: "cancelled" } : appointment));
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title={statusFilter ? "Pending Requests" : "Requests"} subtitle={statusFilter ? "Review consultation requests waiting for a response." : "Manage your consultation requests."} />
        {error && <Notice error>{error}</Notice>}
        {(statusFilter ? appointments.filter((appointment) => appointment.status === statusFilter) : appointments).length > 0 ? (
          <div className={styles.requests}>
            {(statusFilter ? appointments.filter((appointment) => appointment.status === statusFilter) : appointments).map((appointment) => (
              <article className={styles.requestCard} key={appointment.id}>
                <div className={styles.requestIcon} aria-label="Faculty profile"><UserRound size={18} /></div>
                <div className={styles.requestContent}>
                  <strong>{appointment.faculty_name || "Faculty"}</strong>
                  <span>{formatDate(appointment.preferred_date)} at {formatTime(appointment.preferred_time)}</span>
                  <small>{appointment.reason}</small>
                  <em className={styles[`status${capitalize(appointment.status)}`]}>{appointment.status}</em>
                </div>
                {appointment.status === "pending" && <button type="button" className={styles.withdraw} onClick={() => setCancellingId(appointment.id)} aria-label="Cancel request"><X size={16} /></button>}
              </article>
            ))}
          </div>
        ) : <p className={styles.emptyState}>{statusFilter ? "No requests are waiting for a response." : "No appointment requests have been submitted."}</p>}
      </div>
      <ConfirmationModal open={Boolean(cancellingId)} title="Cancel request?" description="The faculty member will no longer be able to approve this consultation request." confirmLabel="Cancel Request" tone="danger" onCancel={() => setCancellingId("")} onConfirm={() => cancelRequest(cancellingId)} />
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
