"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading, FormField } from "@/components/ui";
import { PasswordField } from "@/components/password-field";
import { createClient } from "@/lib/supabase/client";
import { studentAuthEmail } from "@/lib/student-auth";
import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: studentAuthEmail(studentId), password });

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
      setError("Your student profile was not created. Run the Supabase migration, then create the account again.");
      return;
    }

    if (profile.role !== "student") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This account is not registered as a student.");
      return;
    }

    router.replace("/student/home");
    router.refresh();
  }

  return (
    <MobileLayout className={styles.screen} backTo="/welcome">
      <form className={styles.page} onSubmit={handleSubmit}>
        <PageHeading title="Sign In" subtitle="Welcome back! Please enter your credentials." />
        <div className={styles.form}>
          <FormField label="Student ID" name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter your student ID" required />
          <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          <Link className={styles.inlineLink} href="/student/forgot-password">Forgot Password?</Link>
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Signing In..." : "Sign In"}</button>
        <p className={styles.formNote}>Don&apos;t have an account? <Link href="/student/create-account">Sign Up</Link></p>
      </form>
    </MobileLayout>
  );
}
