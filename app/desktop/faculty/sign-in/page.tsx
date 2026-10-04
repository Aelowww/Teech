"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { resendConfirmation, signInAs } from "@/lib/auth-flows";
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
  const params = useSearchParams();
  const confirmFailed = params.get("confirm") === "failed";
  const awaitingReview = params.get("confirmed") === "1" || params.get("submitted") === "1";
  const [facultyId, setFacultyId] = useState("");
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
    const result = await signInAs("faculty", facultyId, password);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      setUnconfirmedEmail(result.unconfirmedEmail || "");
      return;
    }
    router.replace("/faculty/home");
    router.refresh();
  }

  async function resend() {
    const resendError = await resendConfirmation("faculty", unconfirmedEmail);
    setResendNote(resendError || `We sent a new confirmation link to ${unconfirmedEmail}.`);
  }

  if (submitting) return <AppLoader />;

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/welcome">
      <div className={styles.form}>
        {awaitingReview && <Notice>Thanks! An admin is reviewing your Faculty ID. We&apos;ll email you as soon as you can sign in.</Notice>}
        {confirmFailed && <Notice>That confirmation link didn&apos;t work or has expired. If your email is already confirmed, sign in below. Otherwise sign in to get a new link.</Notice>}
        <FormField label="Faculty ID" name="facultyId" value={facultyId} onChange={(event) => setFacultyId(event.target.value.slice(0, 32))} placeholder="Enter your faculty ID" maxLength={32} required />
        <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        <Link className={styles.inlineLink} href="/faculty/forgot-password">Forgot password?</Link>
      </div>
      {error && <Notice error>{error}</Notice>}
      {unconfirmedEmail && <p className={styles.formNote}>Didn&apos;t get it? <button className={styles.textButton} type="button" onClick={resend}>Resend confirmation email</button></p>}
      {resendNote && <Notice>{resendNote}</Notice>}
      <AuthSubmit label="Sign in" pendingLabel="Signing in…" pending={submitting} />
      <p className={styles.formNote}>Don&apos;t have an account? <Link href="/faculty/create-account">Sign up</Link></p>
    </AuthFrame>
  );
}
