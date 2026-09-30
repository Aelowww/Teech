"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader, FormCard, MobileLayout, Notice, FormField } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("Your faculty profile was not created. Run the Supabase migration, then create the account again.");
      return;
    }

    if (profile.role !== "faculty") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This account is not registered as faculty.");
      return;
    }

    router.replace("/faculty/home");
    router.refresh();
  }

  return (
    <MobileLayout className={styles.screen} backTo="/welcome">
      <form className={styles.page} onSubmit={handleSubmit}>
        <BrandHeader />
        <FormCard>
        <div className={styles.form}>
          <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" type="email" required />
          <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          <Link className={styles.inlineLink} href="/faculty/forgot-password">Forgot Password?</Link>
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={submitting}>{submitting ? "Signing In..." : "Sign In"}</button>
        <p className={styles.formNote}>Don&apos;t have an account? <Link href="/faculty/create-account">Sign Up</Link></p>
      </FormCard>
      </form>
    </MobileLayout>
  );
}
