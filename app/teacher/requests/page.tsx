"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Appointment = { id: string; student_name: string | null; student_number: string | null; preferred_date: string; preferred_time: string; reason: string; status: "pending" | "confirmed" | "declined" | "cancelled" };

export default function Page() {
  const router = useRouter();
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRequests() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/teacher/sign-in"); return; }
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (!profile || profile.role !== "faculty") { router.replace("/teacher/sign-in"); return; }
      const { data, error: requestError } = await supabase
        .from("appointment_requests")
        .select("id, student_name, student_number, preferred_date, preferred_time, reason, status")
        .eq("faculty_profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (requestError) setError(requestError.message);
      else setRequests(data as Appointment[] || []);
    }
    void loadRequests();
    return () => { active = false; };
  }, [router]);

  async function updateStatus(id: string, status: "confirmed" | "declined") {
    if (!window.confirm(`${status === "confirmed" ? "Confirm" : "Decline"} this consultation request?`)) return;
    setError(""); setUpdating(id);
    const { error: updateError } = await createClient().from("appointment_requests").update({ status }).eq("id", id);
    setUpdating("");
    if (updateError) { setError(updateError.message); return; }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
  }

  return (
    <MobileLayout className={styles.screen} backTo="/teacher/home" role="teacher" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title="Requests" subtitle="Approve or decline student consultation requests." />
        {error && <Notice error>{error}</Notice>}
        {requests.length ? <div className={styles.requests}>{requests.map((request) => <article className={styles.requestCard} key={request.id}>
          <span className={styles.icon}><ClipboardList size={18} /></span>
          <div className={styles.copy}><strong>{request.student_name || "Student"}</strong><span>{formatDate(request.preferred_date)} at {formatTime(request.preferred_time)}</span><small>{request.student_number || ""}{request.student_number && request.reason ? " - " : ""}{request.reason}</small><em className={styles[`status${capitalize(request.status)}`]}>{request.status}</em></div>
          {request.status === "pending" && <div className={styles.actions}><button type="button" onClick={() => updateStatus(request.id, "confirmed")} disabled={updating === request.id} aria-label="Confirm request"><Check size={16} /></button><button type="button" onClick={() => updateStatus(request.id, "declined")} disabled={updating === request.id} aria-label="Decline request"><X size={16} /></button></div>}
        </article>)}</div> : <p className={styles.empty}>No consultation requests yet.</p>}
      </div>
    </MobileLayout>
  );
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function capitalize(value: string) { return `${value[0].toUpperCase()}${value.slice(1)}` as "Pending" | "Confirmed" | "Declined" | "Cancelled"; }
