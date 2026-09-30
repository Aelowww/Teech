"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileLayout, PageHeading, FormField, Notice } from "@/app/mobile/_components/ui";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}

function ForgotPasswordPage() {
  const router = useRouter();
  const expired = useSearchParams().get("expired") === "true";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);
    const next = encodeURIComponent("/faculty/profile/password");
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
    });
    setSending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    router.push("/faculty/password-reset");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/sign-in">
      <form className={styles.page} onSubmit={handleSubmit}>
        <PageHeading title="Forgot Password?" subtitle="Enter the email linked to your account and we'll send you a reset link." />
        {expired && <Notice error>That reset link is invalid or has expired. Request a new one below.</Notice>}
        <div className={styles.form}>
          <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your school email" type="email" required />
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={sending}>{sending ? "Sending..." : "Send Reset Link"}</button>
      </form>
    </MobileLayout>
  );
}
