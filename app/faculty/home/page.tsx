"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, BrandLogo, ActionButtons, CardList, ProfilePhoto } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import { AppLoader } from "@/components/app-loader";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Profile = { id: string; full_name: string };
type Request = { id: string; student_name: string | null; preferred_date: string; preferred_time: string; reason: string; status: string };

export default function Page() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [availabilityCount, setAvailabilityCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      const { data: currentProfile } = await supabase.from("profiles").select("id, full_name, role").eq("auth_user_id", user.id).maybeSingle();
      if (!currentProfile || currentProfile.role !== "faculty") { await supabase.auth.signOut(); router.replace("/faculty/sign-in"); return; }
      const [requestsResult, availabilityResult] = await Promise.all([
        supabase.from("appointment_requests").select("id, student_name, preferred_date, preferred_time, reason, status").eq("faculty_profile_id", currentProfile.id).order("created_at", { ascending: false }),
        supabase.from("faculty_availability").select("id", { count: "exact", head: true }).eq("faculty_profile_id", currentProfile.id).eq("is_available", true).not("available_date", "is", null),
      ]);
      if (!active) return;
      setProfile(currentProfile);
      setRequests(requestsResult.data as Request[] || []);
      setAvailabilityCount(availabilityResult.count || 0);
      setIsLoading(false);
    }
    void loadDashboard();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  const pending = requests.filter((request) => request.status === "pending");
  const confirmed = requests.filter((request) => request.status === "confirmed");
  const requestItems = pending.slice(0, 1).map((request) => ({ title: request.student_name || "Student", description: `${formatDate(request.preferred_date)} - ${formatTime(request.preferred_time)}`, status: "Pending", href: "/faculty/requests" }));

  return (
    <MobileLayout className={styles.screen} role="faculty" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}><BrandLogo /><NotificationBell href="/faculty/notifications" /></header>
        <div className={styles.greeting}><ProfilePhoto inline /><div><strong>{getGreeting()}</strong><small>{profile?.full_name || "Faculty"}</small></div></div>
        <div className={styles.metrics}>
          <div className={styles.metric}><strong>{pending.length}</strong><span>Pending Requests</span></div>
          <div className={styles.metric}><strong>{confirmed.length}</strong><span>Confirmed</span></div>
          <div className={styles.metric}><strong>{availabilityCount}</strong><span>Available Days</span></div>
        </div>
        <h2 className={styles.sectionTitle}>Pending Request</h2>
        {requestItems.length ? <CardList items={requestItems} /> : <p className={styles.emptyState}>No pending consultation requests.</p>}
        <ActionButtons className={styles.dashboardActions} actions={[{ label: "Manage Availability", href: "/faculty/availability" }, { label: "View Requests", href: "/faculty/requests" }]} primaryLabel="Manage Availability" />
      </div>
    </MobileLayout>
  );
}

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function getGreeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,"; }
