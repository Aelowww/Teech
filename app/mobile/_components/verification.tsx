"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronRight, Clock3, ShieldAlert, ShieldX } from "lucide-react";
import { MobileLayout, Notice } from "@/app/mobile/_components/ui";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { IdUploadField } from "@/app/mobile/_components/id-upload-field";
import { createClient } from "@/lib/supabase/client";
import { identifierLabel, resubmitVerification, useVerification, type Role, type Verification } from "@/lib/verification";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./verification.module.css";

export function VerificationBanner({ role }: { role: Role }) {
  const { verification } = useVerification();
  if (!verification || verification.status === "verified") return null;
  const rejected = verification.status === "rejected";
  const label = identifierLabel(role);

  return (
    <aside className={`${styles.banner} ${rejected ? styles.bannerRejected : ""}`} role="status">
      <span className={styles.bannerIcon}>{rejected ? <ShieldX size={18} /> : <Clock3 size={18} />}</span>
      <Link className={styles.bannerBody} href={`/${role}/verification`}>
        <strong>{rejected ? `We couldn't verify your ${label}` : "Verification in progress"}</strong>
        <small>
          {rejected
            ? verification.note || `Update your ${label} so an admin can review it again.`
            : role === "student"
              ? "An admin is confirming your Student ID. Booking unlocks once you're verified."
              : "An admin is confirming your Faculty ID. Students can book you once you're verified."}
        </small>
      </Link>
      <Link className={styles.bannerAction} href={`/${role}/verification`} aria-label="View verification status"><ChevronRight size={18} /></Link>
    </aside>
  );
}

export function VerificationGate({ role, activeNav, children }: { role: Role; activeNav: string; children: React.ReactNode }) {
  const { loading, verification, error, reload } = useVerification();
  if (loading) return <AppLoader />;
  if (verification?.status === "verified") return <>{children}</>;

  return (
    <MobileLayout role={role} activeNav={activeNav} backTo={`/${role}/home`}>
      <div className={styles.gate}>
        {verification ? <VerificationCard verification={verification} onChange={reload} locked /> : <Notice error>{error}</Notice>}
      </div>
    </MobileLayout>
  );
}

export function VerificationPage({ role }: { role: Role }) {
  const { loading, verification, error, reload } = useVerification();
  if (loading) return <AppLoader />;

  return (
    <MobileLayout role={role} activeNav="profile" backTo={`/${role}/profile`}>
      <div className={styles.gate}>
        {verification ? <VerificationCard verification={verification} onChange={reload} /> : <Notice error>{error}</Notice>}
      </div>
    </MobileLayout>
  );
}

function VerificationCard({ verification, onChange, locked = false }: { verification: Verification; onChange: () => Promise<void>; locked?: boolean }) {
  const { role, status } = verification;
  const label = identifierLabel(role);
  const copy = {
    verified: {
      Icon: BadgeCheck,
      title: "You're verified",
      body: role === "student" ? "Your Student ID is confirmed. You can book consultations." : "Your Faculty ID is confirmed. Students can book consultations with you.",
    },
    pending: {
      Icon: Clock3,
      title: locked ? "Available once you're verified" : "Verification in progress",
      body: role === "student"
        ? "To keep Teech safe, an admin confirms every Student ID before it can be used to book consultations. This usually doesn't take long."
        : "To keep Teech safe, an admin confirms every Faculty ID before students can see your schedule or book you. This usually doesn't take long.",
    },
    rejected: {
      Icon: ShieldAlert,
      title: `We couldn't verify your ${label}`,
      body: role === "faculty"
        ? "Check the reason below, then correct your Faculty ID and upload a new photo of it for review."
        : `Check the reason below, correct your ${label}, and resubmit it for review.`,
    },
  }[status];

  return (
    <section className={`${styles.card} ${styles[status]}`} aria-live="polite">
      <span className={styles.cardIcon}><copy.Icon size={26} /></span>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <dl className={styles.facts}>
        <div><dt>{label}</dt><dd>{verification.identifier || verification.rejectedIdentifier || "Not provided"}</dd></div>
        <div><dt>Status</dt><dd><span className={styles.pill}>{status === "verified" ? "Verified" : status === "pending" ? "Pending review" : "Needs correction"}</span></dd></div>
      </dl>
      {status === "rejected" && verification.note && <p className={styles.reason}><strong>Reason:</strong> {verification.note}</p>}
      {status === "rejected" && <ResubmitForm role={role} initial={verification.rejectedIdentifier || ""} onDone={onChange} />}
      {status !== "rejected" && (
        <Link className={`${buttonStyles.button} ${buttonStyles.secondary}`} href={`/${role}/home`}>Back to home</Link>
      )}
    </section>
  );
}

function ResubmitForm({ role, initial, onDone }: { role: Role; initial: string; onDone: () => Promise<void> }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const router = useRouter();
  const label = identifierLabel(role);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await resubmitVerification(role, value, idFile);
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
        <span>Correct {label}</span>
        <input
          value={value}
          onChange={(event) => setValue(role === "student" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value.slice(0, 32))}
          inputMode={role === "student" ? "numeric" : "text"}
          pattern={role === "student" ? "\\d{6}" : undefined}
          maxLength={role === "student" ? 6 : 32}
          placeholder={`Enter your ${label}`}
          required
        />
      </label>
      {role === "faculty" && <IdUploadField label="New Faculty ID photo" file={idFile} onChange={(file) => { setError(""); setIdFile(file); }} />}
      {error && <Notice error>{error}</Notice>}
      <button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving}>{saving ? "Submitting…" : "Resubmit for review"}</button>
    </form>
  );
}
