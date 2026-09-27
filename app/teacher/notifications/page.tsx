"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Update = { id: string; student_name: string | null; preferred_date: string; status: string };

export default function Page() {
  const [updates, setUpdates] = useState<Update[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; async function load() {
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle(); if (!profile) return;
    const { data, error: requestError } = await supabase.from("appointment_requests").select("id, student_name, preferred_date, status").eq("faculty_profile_id", profile.id).order("updated_at", { ascending: false });
    if (!active) return; if (requestError) setError(requestError.message); else setUpdates(data as Update[] || []);
  } void load(); return () => { active = false; }; }, []);
  return <MobileLayout className={styles.screen} backTo="/teacher/home" role="teacher"><div className={styles.page}><PageHeading title="Notifications" />{error && <Notice error>{error}</Notice>}{updates.length ? <div className={styles.updates}>{updates.map((update) => <article key={update.id}><Bell size={17}/><div><strong>{update.student_name || "Student"}</strong><span>{messageFor(update.status, update.preferred_date)}</span></div></article>)}</div> : <p className={styles.empty}>No consultation updates yet.</p>}</div></MobileLayout>;
}
function messageFor(status: string, date: string) { const formatted = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); return status === "pending" ? `Requested a consultation for ${formatted}.` : `Consultation for ${formatted} is ${status}.`; }
