"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { resendConfirmation, signInAs } from "@/lib/auth-flows";
import { clearAppointmentDraft } from "@/lib/local-appointments";
import styles from "@/app/desktop/_components/auth.module.css";

export default function Page() {
  return (
    <Suspense fallback={<AppLoader />}>
      <SignInPage />
    </Suspense>
  );
}

function SignInPage() {
  const router = useRouter();
  const confirmFailed = useSearchParams().get("confirm") === "failed";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [resendNote, setResendNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUnconfirmedEmail("");
    setResendNote("");
    setSubmitting(true);
    const result = await signInAs("student", identifier, password);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      setUnconfirmedEmail(result.unconfirmedEmail || "");
      return;
    }
    clearAppointmentDraft();
    router.replace("/student/home");
    router.refresh();
  }

  async function resend() {
    const resendError = await resendConfirmation("student", unconfirmedEmail);
    setResendNote(resendError || `We sent a new confirmation link to ${unconfirmedEmail}.`);
  }

  if (submitting) return <AppLoader />;

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/welcome">
      <div className={styles.form}>
        {confirmFailed && <Notice>That confirmation link didn&apos;t work or has expired. If your email is already confirmed, sign in below. Otherwise sign in to get a new link.</Notice>}
        <FormField label="Student ID" name="studentId" value={identifier} onChange={(event) => setIdentifier(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter your student ID" inputMode="numeric" pattern="\d{6}" maxLength={6} required />
        <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        <Link className={styles.inlineLink} href="/student/forgot-password">Forgot password?</Link>
      </div>
      {error && <Notice error>{error}</Notice>}
      {unconfirmedEmail && <p className={styles.formNote}>Didn&apos;t get it? <button className={styles.textButton} type="button" onClick={resend}>Resend confirmation email</button></p>}
      {resendNote && <Notice>{resendNote}</Notice>}
      <AuthSubmit label="Sign in" pendingLabel="Signing in…" pending={submitting} />
      <p className={styles.formNote}>Don&apos;t have an account? <Link href="/student/create-account">Sign up</Link></p>
    </AuthFrame>
  );
}
