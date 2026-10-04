"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronRight, Clock3, IdCard, ShieldAlert, ShieldX } from "lucide-react";
import { DesktopLayout, Notice } from "@/app/desktop/_components/ui";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { IdUploadField } from "@/app/desktop/_components/id-upload-field";
import { createClient } from "@/lib/supabase/client";
import { identifierLabel, submitVerification, useVerification, type Role, type Verification } from "@/lib/verification";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import styles from "./verification.module.css";

export function VerificationBanner({ role }: { role: Role }) {
  const { verification } = useVerification();
  if (!verification || verification.status === "verified") return null;
  const { status } = verification;
  const label = identifierLabel(role);
  const alert = status === "rejected" || status === "unsubmitted";
  const title = status === "unsubmitted" ? "Verify your identity" : status === "rejected" ? `We couldn't verify your ${label}` : "Verification in progress";
  const body = status === "unsubmitted"
    ? "Submit your Student ID so you can start booking consultations."
    : status === "rejected"
      ? verification.note || `Update your ${label} so an admin can review it again.`
      : role === "student"
        ? "An admin is confirming your Student ID. Booking unlocks once you're verified."
        : "An admin is confirming your Faculty ID. Students can book you once you're verified.";

  return (
    <aside className={`${styles.banner} ${alert ? styles.bannerRejected : ""}`} role="status">
      <span className={styles.bannerIcon}>{status === "unsubmitted" ? <IdCard size={18} /> : status === "rejected" ? <ShieldX size={18} /> : <Clock3 size={18} />}</span>
      <Link className={styles.bannerBody} href={`/${role}/verification`}>
        <strong>{title}</strong>
        <small>{body}</small>
      </Link>
      <Link className={styles.bannerAction} href={`/${role}/verification`} aria-label={title}><ChevronRight size={18} /></Link>
    </aside>
  );
}

export function VerificationGate({ role, activeNav, children }: { role: Role; activeNav: string; children: React.ReactNode }) {
  const { loading, verification, error, reload } = useVerification();
  if (loading) return <AppLoader />;
  if (verification?.status === "verified") return <>{children}</>;

  return (
    <DesktopLayout role={role} activeNav={activeNav} backTo={`/${role}/home`}>
      <div className={styles.gate}>
        {verification ? <VerificationCard verification={verification} onChange={reload} locked /> : <Notice error>{error}</Notice>}
      </div>
    </DesktopLayout>
  );
}

export function VerificationPage({ role }: { role: Role }) {
  const { loading, verification, error, reload } = useVerification();
  if (loading) return <AppLoader />;

  return (
    <DesktopLayout role={role} activeNav="profile" backTo={`/${role}/profile`}>
      <div className={styles.gate}>
        {verification ? <VerificationCard verification={verification} onChange={reload} /> : <Notice error>{error}</Notice>}
      </div>
    </DesktopLayout>
  );
}

function VerificationCard({ verification, onChange, locked = false }: { verification: Verification; onChange: () => Promise<void>; locked?: boolean }) {
  const { role, status } = verification;
  const label = identifierLabel(role);
  const copy = {
    unsubmitted: {
      Icon: IdCard,
      title: "Verify your identity",
      body: locked
        ? "Booking consultations is available once you're verified. Submit your Student ID and an admin will review it."
        : "Submit your Student ID, department, and a photo of your ID card. An admin will review it, and booking unlocks once you're approved.",
    },
    verified: {
      Icon: BadgeCheck,
      title: "You're verified",
      body: role === "student" ? "Your Student ID is confirmed. You can book consultations." : "Your Faculty ID is confirmed. Students can book consultations with you.",
    },
    pending: {
      Icon: Clock3,
      title: locked ? "Available once you're verified" : "Verification in progress",
      body: role === "student"
        ? "An admin is reviewing your Student ID. You can still use your streaks and profile while you wait."
        : "An admin is reviewing your Faculty ID. Students can book you once it's approved.",
    },
    rejected: {
      Icon: ShieldAlert,
      title: `We couldn't verify your ${label}`,
      body: `Check the reason below, then correct your details and upload a new photo of your ${label}.`,
    },
  }[status];
  const needsForm = status === "unsubmitted" || status === "rejected";

  return (
    <section className={`${styles.card} ${styles[status === "unsubmitted" ? "pending" : status]}`} aria-live="polite">
      <span className={styles.cardIcon}><copy.Icon size={26} /></span>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      {status !== "unsubmitted" && (
        <dl className={styles.facts}>
          <div><dt>{label}</dt><dd>{verification.identifier || verification.rejectedIdentifier || "Not provided"}</dd></div>
          <div><dt>Status</dt><dd><span className={styles.pill}>{status === "verified" ? "Verified" : status === "pending" ? "Pending review" : "Needs correction"}</span></dd></div>
        </dl>
      )}
      {status === "rejected" && verification.note && <p className={styles.reason}><strong>Reason:</strong> {verification.note}</p>}
      {needsForm && <IdentityForm role={role} initialId={verification.rejectedIdentifier || ""} initialDepartment={verification.department || ""} resubmitting={status === "rejected"} onDone={onChange} />}
      {!needsForm && <Link className={`${buttonStyles.button} ${buttonStyles.secondary}`} href={`/${role}/home`}>Back to home</Link>}
    </section>
  );
}

function IdentityForm({ role, initialId, initialDepartment, resubmitting, onDone }: { role: Role; initialId: string; initialDepartment: string; resubmitting: boolean; onDone: () => Promise<void> }) {
  const [identifier, setIdentifier] = useState(initialId);
  const [department, setDepartment] = useState(initialDepartment);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const label = identifierLabel(role);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await submitVerification(role, identifier, idFile, department);
    if (result) {
      setSaving(false);
      setError(result);
      return;
    }
    if (role === "faculty") {
      await createClient().auth.signOut();
      router.replace("/faculty/sign-in?submitted=1");
      router.refresh();
      return;
    }
    setSaving(false);
    await onDone();
  }

  return (
    <form className={styles.resubmit} onSubmit={handleSubmit}>
      <label>
        <span>{label}</span>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(role === "student" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value.slice(0, 32))}
          inputMode={role === "student" ? "numeric" : "text"}
          pattern={role === "student" ? "\\d{6}" : undefined}
          maxLength={role === "student" ? 6 : 32}
          placeholder={`Enter your ${label}`}
          required
        />
      </label>
      {role === "student" && (
        <label>
          <span>Department</span>
          <input value={department} onChange={(event) => setDepartment(event.target.value.slice(0, 80))} maxLength={80} placeholder="Enter your department" required />
        </label>
      )}
      <IdUploadField label={`${label} photo`} file={idFile} onChange={(file) => { setError(""); setIdFile(file); }} />
      {error && <Notice error>{error}</Notice>}
      <button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving || !identifier.trim() || !idFile || (role === "student" && !department.trim())}>{saving ? "Submitting…" : resubmitting ? "Resubmit for review" : "Submit for verification"}</button>
    </form>
  );
}
