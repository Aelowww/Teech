"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import { accountRole } from "@/lib/account-role";
import styles from "@/app/desktop/_components/auth.module.css";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setSubmitting(false);
      setError(signInError?.message || "Unable to sign in.");
      return;
    }

    const role = await accountRole(supabase, data.user.id);

    if (!role) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("We couldn't load your profile. Please try again in a moment.");
      return;
    }

    if (role !== "faculty") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This account is not registered as faculty.");
      return;
    }

    router.replace("/faculty/home");
    router.refresh();
  }


  if (submitting) return <AppLoader />;

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/welcome">
      <div className={styles.form}>
        <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" type="email" required />
        <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        <Link className={styles.inlineLink} href="/faculty/forgot-password">Forgot password?</Link>
      </div>
      {error && <Notice error>{error}</Notice>}
      <AuthSubmit label="Sign in" pendingLabel="Signing in…" pending={submitting} />
      <p className={styles.formNote}>Don&apos;t have an account? <Link href="/faculty/create-account">Sign up</Link></p>
    </AuthFrame>
  );
}
