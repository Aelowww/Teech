"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock3, FileWarning, GraduationCap, IdCard, MailWarning, RefreshCw, Search, ShieldX, UserRound } from "lucide-react";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { facultyIdBucket } from "@/lib/faculty-id";
import { useRealtimeRefresh } from "@/lib/admin";
import styles from "../admin.module.css";

type Status = "pending" | "verified" | "rejected";

type Account = {
  profile_id: string;
  role: "student" | "faculty";
  full_name: string;
  email: string;
  identifier: string | null;
  course_year: string | null;
  department: string | null;
  verification_status: Status | "unsubmitted";
  verification_note: string | null;
  rejected_identifier: string | null;
  document_path: string | null;
  email_confirmed: boolean;
  created_at: string;
  verified_at: string | null;
};

const reviewMessages: Record<string, string> = {
  email_unconfirmed: "This user hasn't confirmed their email yet, so they can't be approved.",
  missing_identifier: "This account has no ID on file to approve.",
  note_required: "Add a reason so the user knows what to fix.",
  note_too_long: "Keep the reason under 300 characters.",
  not_found: "This account no longer exists.",
};

const emailMessages: Record<string, string> = {
  not_configured: "No email was sent because email sending isn't set up yet (SMTP_USER and SMTP_PASS).",
  no_email: "No email was sent because this account has no real email address.",
  send_failed: "The decision was saved, but the email couldn't be sent.",
};

const tabs: { key: Status; label: string; Icon: typeof Clock3 }[] = [
  { key: "pending", label: "Pending", Icon: Clock3 },
  { key: "verified", label: "Verified", Icon: BadgeCheck },
  { key: "rejected", label: "Rejected", Icon: ShieldX },
];

export function VerificationQueue({ role }: { role: "student" | "faculty" }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tab, setTab] = useState<Status>("pending");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await createClient().rpc("admin_verification_queue");
    if (loadError) setError(loadError.message);
    else {
      setError("");
      setAccounts((data || []) as Account[]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => { if (active) await load(); };
    void run();
    return () => { active = false; };
  }, [load]);

  useRealtimeRefresh("profiles", load);

  const counts = useMemo(() => {
    const result: Record<Status, number> = { pending: 0, verified: 0, rejected: 0 };
    accounts.forEach((account) => { if (account.role === role && account.verification_status !== "unsubmitted") result[account.verification_status] += 1; });
    return result;
  }, [accounts, role]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts
      .filter((account) => account.verification_status === tab)
      .filter((account) => account.role === role)
      .filter((account) => !needle || [account.full_name, account.email, account.identifier, account.rejected_identifier].some((value) => value?.toLowerCase().includes(needle)))
      .sort((a, b) => tab === "pending" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
  }, [accounts, tab, role, query]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function review(account: Account, decision: "approve" | "reject", note?: string) {
    setBusy(account.profile_id);
    setRowErrors((current) => ({ ...current, [account.profile_id]: "" }));
    const { data, error: reviewError } = await createClient().rpc("admin_review_account", { target_profile_id: account.profile_id, decision, note: note ?? null });
    setBusy(null);
    if (reviewError || data !== "ok") {
      const message = reviewError?.message || reviewMessages[data as string] || "Something went wrong.";
      setRowErrors((current) => ({ ...current, [account.profile_id]: message }));
      if (reviewError?.code === "42501") router.replace("/admin/sign-in");
      return;
    }
    setRejecting(null);
    const emailResult = await fetch("/api/admin/verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: account.profile_id }),
    }).then((response) => response.json() as Promise<{ sent: boolean; reason?: string }>).catch(() => ({ sent: false, reason: "send_failed" }));
    const verb = decision === "approve" ? "Approved" : account.verification_status === "verified" ? "Revoked" : "Rejected";
    setNotice(emailResult.sent ? `${verb} ${account.full_name}. We emailed them at ${account.email}.` : `${verb} ${account.full_name}. ${emailMessages[emailResult.reason || ""] || emailMessages.send_failed}`);
    await load();
  }

  if (!ready) return <AppLoader />;

  return (
    <div className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>{role === "student" ? "Student verification" : "Faculty verification"}</h1>
            <p>{role === "student" ? "Check each Student ID against school records, then approve or reject it. Students can book consultations once approved." : "Check each Faculty ID and its uploaded photo, then approve or reject it. Teachers can sign in once approved."}</p>
          </div>
          <button className={styles.ghostButton} type="button" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={16} className={refreshing ? styles.spin : ""} />Refresh</button>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Verification status">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ""} ${styles[`tab_${key}`]}`} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              <span className={styles.tabIcon}><Icon size={18} /></span>
              <span className={styles.tabText}><strong>{counts[key]}</strong><small>{label}</small></span>
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          <label className={styles.search}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or ID" aria-label="Search accounts" />
          </label>
          </div>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice} role="status">{notice}</p>}

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <BadgeCheck size={28} />
            <strong>{tab === "pending" ? "You're all caught up" : "Nothing here yet"}</strong>
            <small>{tab === "pending" ? `New ${role === "student" ? "students" : "teachers"} waiting for review will appear here.` : "Accounts will show up here after they're reviewed."}</small>
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map((account) => (
              <li key={account.profile_id} className={styles.row}>
                <div className={styles.identity}>
                  <span className={styles.avatar}>{account.role === "student" ? <GraduationCap size={18} /> : <UserRound size={18} />}</span>
                  <div>
                    <strong>{account.full_name}</strong>
                    <small>{account.email}</small>
                  </div>
                </div>

                <dl className={styles.meta}>
                  <div><dt>{account.role === "student" ? "Student ID" : "Faculty ID"}</dt><dd className={styles.mono}>{account.identifier || account.rejected_identifier || "—"}</dd></div>
                  <div><dt>Department</dt><dd>{account.department || account.course_year || "—"}</dd></div>
                  <div><dt>{tab === "pending" ? "Signed up" : "Reviewed"}</dt><dd>{formatDate(tab === "verified" && account.verified_at ? account.verified_at : account.created_at)}</dd></div>
                </dl>

                {account.document_path ? <DocumentViewer path={account.document_path} label={account.role === "student" ? "Student ID" : "Faculty ID"} /> : <p className={styles.warning}><FileWarning size={14} />No ID photo uploaded</p>}
                {!account.email_confirmed && <p className={styles.warning}><MailWarning size={14} />Email not confirmed yet</p>}
                {account.verification_status === "rejected" && account.verification_note && <p className={styles.note}><strong>Reason:</strong> {account.verification_note}</p>}
                {rowErrors[account.profile_id] && <p className={styles.error}>{rowErrors[account.profile_id]}</p>}

                {rejecting === account.profile_id ? (
                  <RejectForm
                    label={role === "student" ? "Student ID" : "Faculty ID"}
                    verb={account.verification_status === "verified" ? "Revoke" : "Reject"}
                    busy={busy === account.profile_id}
                    onCancel={() => setRejecting(null)}
                    onSubmit={(note) => void review(account, "reject", note)}
                  />
                ) : (
                  <div className={styles.actions}>
                    {account.verification_status === "pending" && (
                      <>
                        <button className={styles.approve} type="button" disabled={busy === account.profile_id || !account.email_confirmed} onClick={() => void review(account, "approve")}>
                          <BadgeCheck size={16} />{busy === account.profile_id ? "Saving…" : "Approve"}
                        </button>
                        <button className={styles.reject} type="button" disabled={busy === account.profile_id} onClick={() => setRejecting(account.profile_id)}><ShieldX size={16} />Reject</button>
                      </>
                    )}
                    {account.verification_status === "verified" && (
                      <button className={styles.reject} type="button" disabled={busy === account.profile_id} onClick={() => setRejecting(account.profile_id)}><ShieldX size={16} />Revoke</button>
                    )}
                    {account.verification_status === "rejected" && <small className={styles.waiting}>Waiting for the user to correct their ID</small>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

function DocumentViewer({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isPdf = path.endsWith(".pdf");

  async function open() {
    setLoading(true);
    setError("");
    const { data, error: signError } = await createClient().storage.from(facultyIdBucket).createSignedUrl(path, 120);
    setLoading(false);
    if (signError || !data) {
      setError("Couldn't load the ID photo.");
      return;
    }
    if (isPdf) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    else setUrl(data.signedUrl);
  }

  if (url) {
    return (
      <figure className={styles.document}>
        <Image src={url} alt={`Uploaded ${label}`} width={640} height={400} unoptimized />
        <button className={styles.ghostButton} type="button" onClick={() => setUrl("")}>Hide ID photo</button>
      </figure>
    );
  }

  return (
    <div className={styles.documentRow}>
      <button className={styles.ghostButton} type="button" onClick={() => void open()} disabled={loading}><IdCard size={16} />{loading ? "Loading…" : isPdf ? `Open ${label} (PDF)` : `View ${label} photo`}</button>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

function RejectForm({ label, verb, busy, onCancel, onSubmit }: { label: string; verb: string; busy: boolean; onCancel: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (note.trim()) onSubmit(note.trim());
  }

  return (
    <form className={styles.rejectForm} onSubmit={handleSubmit}>
      <label>
        <span>Reason shown to the user</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} placeholder={`e.g. This ${label} doesn't match our records for this name.`} rows={2} maxLength={300} required autoFocus />
      </label>
      <div className={styles.actions}>
        <button className={styles.reject} type="submit" disabled={busy || !note.trim()}>{busy ? "Saving…" : `${verb} account`}</button>
        <button className={styles.ghostButton} type="button" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
