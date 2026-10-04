"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { MobileLayout, PageHeading, FormField, Notice, StatusIndicator } from "@/app/mobile/_components/ui";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

export default function Page() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ForgotPasswordPage />
    </Suspense>
  );
}

function ForgotPasswordPage() {
  const expired = useSearchParams().get("expired") === "true";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    const next = encodeURIComponent("/student/profile/password");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
    });
    setSending(false);
    if (resetError) {
      setError(resetError.code === "over_email_send_rate_limit" ? "Please wait a minute before requesting another link." : resetError.message);
      return;
    }
    setSent(true);
  }

  if (sending) return <AppLoader />;

  if (sent) {
    return (
      <MobileLayout className={styles.screen} backTo="/student/sign-in">
        <div className={styles.page}>
          <StatusIndicator status="success" />
          <PageHeading title="Check your email" subtitle="If an account uses that email, a password reset link is on its way." />
          <Notice>Open the link on this device to choose a new password.</Notice>
          <Link className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} href="/student/sign-in">Back to Sign In</Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <form className={styles.page} onSubmit={handleSubmit}>
        <PageHeading title="Forgot Password?" subtitle="Enter the email you used when you signed up and we'll send you a reset link." />
        {expired && <Notice error>That reset link is invalid or has expired. Request a new one below.</Notice>}
        <div className={styles.form}>
          <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" type="email" required />
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={sending}>{sending ? "Sending..." : "Send Reset Link"}</button>
      </form>
    </MobileLayout>
  );
}
