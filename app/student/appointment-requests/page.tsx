"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClipboardList, X } from "lucide-react";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
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
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") === "pending" ? "pending" : "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

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
        if (active) setError("Your profile could not be loaded.");
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
    }
    void loadAppointments();
    return () => { active = false; };
  }, []);

  async function cancelRequest(id: string) {
    if (!window.confirm("Cancel this consultation request?")) return;
    const { error: cancelError } = await createClient()
      .from("appointment_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
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
                <div className={styles.requestIcon}><ClipboardList size={18} /></div>
                <div className={styles.requestContent}>
                  <strong>{appointment.faculty_name || "Faculty"}</strong>
                  <span>{formatDate(appointment.preferred_date)} at {formatTime(appointment.preferred_time)}</span>
                  <small>{appointment.reason}</small>
                  <em className={styles[`status${capitalize(appointment.status)}`]}>{appointment.status}</em>
                </div>
                {appointment.status === "pending" && <button type="button" className={styles.withdraw} onClick={() => cancelRequest(appointment.id)} aria-label="Cancel request"><X size={16} /></button>}
              </article>
            ))}
          </div>
        ) : <p className={styles.emptyState}>{statusFilter ? "No requests are waiting for a response." : "No appointment requests have been submitted."}</p>}
      </div>
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
