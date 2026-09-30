"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Ban, Check, CheckCircle2, Inbox, UserRound, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState, DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { SuccessModal } from "@/app/desktop/_components/success-modal";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";
import { studentAvatarUrls } from "@/lib/avatar";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ShowMoreButton, useShowMore } from "@/app/desktop/_components/show-more";
import { matchesTab, RequestTabs, type RequestTab } from "@/app/desktop/_components/request-tabs";
import styles from "./page.module.css";

type Appointment = { id: string; student_name: string | null; student_number: string | null; preferred_date: string; preferred_time: string; reason: string; status: "pending" | "confirmed" | "declined" | "cancelled" };

export default function Page() {
  const router = useRouter();
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(() => new Map());
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<RequestTab>("all");
  const [pendingAction, setPendingAction] = useState<{ id: string; status: "confirmed" | "declined" } | null>(null);
  const [done, setDone] = useState<"confirmed" | "declined" | null>(null);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    async function loadRequests() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (!profile || profile.role !== "faculty") { router.replace("/faculty/sign-in"); return; }
      const { data, error: requestError } = await supabase
        .from("appointment_requests")
        .select("id, student_name, student_number, preferred_date, preferred_time, reason, status")
        .eq("faculty_profile_id", profile.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (requestError) setError(requestError.message);
      else setRequests(data as Appointment[] || []);
      if (data?.length) void studentAvatarUrls(supabase, data.map((request) => request.id)).then((urls) => { if (active) setPhotoUrls(urls); });
      setIsLoading(false);

      channel = supabase
        .channel(uniqueChannelName(`faculty-requests-${profile.id}`))
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointment_requests", filter: `faculty_profile_id=eq.${profile.id}` },
          (payload) => {
            const changedRequest = payload.new as Appointment;
            setRequests((current) => {
              if (payload.eventType === "INSERT") {
                void studentAvatarUrls(supabase, [changedRequest.id]).then((urls) => { if (active && urls.size) setPhotoUrls((known) => new Map([...known, ...urls])); });
                return [changedRequest, ...current];
              }
              return current.map((request) => request.id === changedRequest.id ? { ...request, ...changedRequest } : request);
            });
          },
        )
        .subscribe();
    }
    void loadRequests();
    return () => {
      active = false;
      if (channel) void createClient().removeChannel(channel);
    };
  }, [router]);

  const sortedRequests = [...requests]
    .filter((request) => matchesTab(request.status, tab))
    .sort((first, second) => Number(second.status === "pending") - Number(first.status === "pending"));
  const list = useShowMore(sortedRequests);

  if (isLoading) return <AppLoader />;

  async function updateStatus(id: string, status: "confirmed" | "declined") {
    setError(""); setUpdating(id);
    const { data: updated, error: updateError } = await createClient().from("appointment_requests").update({ status }).eq("id", id).eq("status", "pending").select("id");
    setUpdating("");
    if (updateError) return updateError.message;
    if (!updated?.length) return "This request is no longer pending. Refresh to see its latest status.";
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    setDone(status);
  }

  return (
    <DesktopLayout className={styles.screen} role="faculty" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title="Requests" subtitle="Approve or decline student consultation requests." />
        {requests.length > 0 && <RequestTabs statuses={requests.map((request) => request.status)} active={tab} onChange={setTab} />}
        {error && <Notice error>{error}</Notice>}
        {sortedRequests.length ? <div className={styles.requests}>{list.visible.map((request) => <article className={styles.requestCard} key={request.id}>
          <span className={styles.icon} aria-label="Student profile">{photoUrls.get(request.id) ? <Image className={styles.iconImage} src={photoUrls.get(request.id) as string} alt="" fill sizes="48px" unoptimized /> : <UserRound size={18} />}</span>
          <Link className={styles.copy} href={`/faculty/requests/${request.id}`} aria-label={`View request from ${request.student_name || "student"}`}><strong>{request.student_name || "Student"}</strong><span>{formatDate(request.preferred_date)} at {formatTime(request.preferred_time)}</span><small>{request.student_number || ""}{request.student_number && request.reason ? " - " : ""}{request.reason}</small><em className={styles[`status${capitalize(request.status)}`]}>{request.status === "pending" && isPastDate(request.preferred_date) ? "Expired" : capitalize(request.status)}</em></Link>
          {request.status === "pending" && <div className={styles.actions}>{!isPastDate(request.preferred_date) && <button type="button" onClick={() => setPendingAction({ id: request.id, status: "confirmed" })} disabled={updating === request.id} aria-label="Confirm request"><Check size={16} /></button>}<button type="button" onClick={() => setPendingAction({ id: request.id, status: "declined" })} disabled={updating === request.id} aria-label="Decline request"><X size={16} /></button></div>}
          {request.status !== "pending" && <span className={`${styles.statusIcon} ${styles[`statusIcon${capitalize(request.status)}`]}`} title={`Request ${request.status}`} aria-label={`Request ${request.status}`}>{request.status === "confirmed" ? <CheckCircle2 size={21} /> : request.status === "declined" ? <XCircle size={21} /> : <Ban size={20} />}</span>}
        </article>)}<ShowMoreButton remaining={list.remaining} canCollapse={list.canCollapse} onShowMore={list.showMore} onShowLess={list.showLess} /></div> : requests.length === 0
          ? <EmptyState icon={<Inbox size={30} />} title="No requests yet" description="Students can request a consultation once you publish available dates. Keep your calendar up to date." action={{ label: "Manage availability", href: "/faculty/availability" }} />
          : <EmptyState icon={<CheckCircle2 size={30} />} title={tab === "pending" ? "You're all caught up" : tab === "confirmed" ? "No confirmed consultations" : "Nothing closed yet"} description={tab === "pending" ? "No requests are waiting for your response." : tab === "confirmed" ? "Requests you confirm will show up here." : "Declined and cancelled requests will show up here."} />}
      </div>
      <ConfirmationModal open={Boolean(pendingAction)} title={pendingAction?.status === "confirmed" ? "Confirm request?" : "Decline request?"} description={pendingAction?.status === "confirmed" ? "The student will see that their consultation request has been confirmed." : "The student will see that their consultation request was declined."} confirmLabel={pendingAction?.status === "confirmed" ? "Confirm Request" : "Decline Request"} tone={pendingAction?.status === "declined" ? "danger" : "default"} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction ? updateStatus(pendingAction.id, pendingAction.status) : undefined} />
      <SuccessModal open={Boolean(done)} title={done === "confirmed" ? "Request confirmed" : "Request declined"} description={done === "confirmed" ? "The student has been notified that their consultation is confirmed." : "The student has been notified that their request was declined."} onDone={() => setDone(null)} />
    </DesktopLayout>
  );
}

function isPastDate(value: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return value < today;
}
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function formatTime(value: string) { return new Date(`1970-01-01T${value}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function capitalize(value: string) { return `${value[0].toUpperCase()}${value.slice(1)}` as "Pending" | "Confirmed" | "Declined" | "Cancelled"; }
