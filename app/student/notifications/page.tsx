"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Update = { id: string; faculty_name: string | null; preferred_date: string; status: string };

export default function Page() {
  const [updates, setUpdates] = useState<Update[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; async function load() {
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle(); if (!profile) return;
    const { data, error: requestError } = await supabase.from("appointment_requests").select("id, faculty_name, preferred_date, status").eq("student_profile_id", profile.id).neq("status", "pending").order("updated_at", { ascending: false });
    if (!active) return; if (requestError) setError(requestError.message); else setUpdates(data as Update[] || []);
  } void load(); return () => { active = false; }; }, []);
  return <MobileLayout className={styles.screen} backTo="/student/home" role="student"><div className={styles.page}><PageHeading title="Notifications" />{error && <Notice error>{error}</Notice>}{updates.length ? <div className={styles.updates}>{updates.map((update) => <article key={update.id}><Bell size={17}/><div><strong>{update.faculty_name || "Faculty"}</strong><span>Your {formatStatus(update.status)} consultation for {formatDate(update.preferred_date)}.</span></div></article>)}</div> : <p className={styles.empty}>No appointment updates yet.</p>}</div></MobileLayout>;
}
function formatStatus(value: string) { return value === "confirmed" ? "was confirmed" : value === "declined" ? "was declined" : "was cancelled"; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
