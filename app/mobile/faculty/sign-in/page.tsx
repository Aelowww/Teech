"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandHeader, FormCard, MobileLayout, Notice, FormField } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { resendConfirmation, signInAs } from "@/lib/auth-flows";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

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
  const [email, setEmail] = useState("");
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
    const result = await signInAs("faculty", email, password);
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
    <MobileLayout className={styles.screen} backTo="/welcome">
      <form className={styles.page} onSubmit={handleSubmit}>
        <BrandHeader />
        <FormCard>
        <div className={styles.form}>
          {awaitingReview && <Notice>Thanks! An admin is reviewing your Faculty ID. We&apos;ll email you as soon as you can sign in.</Notice>}
          {confirmFailed && <Notice>That confirmation link didn&apos;t work or has expired. If your email is already confirmed, sign in below. Otherwise sign in to get a new link.</Notice>}
          <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" type="email" required />
          <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          <Link className={styles.inlineLink} href="/faculty/forgot-password">Forgot Password?</Link>
        </div>
        {error && <Notice error>{error}</Notice>}
        {unconfirmedEmail && <p className={styles.formNote}>Didn&apos;t get it? <button className={styles.textButton} type="button" onClick={resend}>Resend confirmation email</button></p>}
        {resendNote && <Notice>{resendNote}</Notice>}
        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={submitting}>{submitting ? "Signing In..." : "Sign In"}</button>
        <p className={styles.formNote}>Don&apos;t have an account? <Link href="/faculty/create-account">Sign Up</Link></p>
      </FormCard>
      </form>
    </MobileLayout>
  );
}
