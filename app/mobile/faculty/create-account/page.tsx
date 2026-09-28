"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading, FormField } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { createClient } from "@/lib/supabase/client";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import styles from "./page.module.css";

type SignUpForm = {
  fullName: string;
  facultyNumber: string;
  department: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: SignUpForm = {
  fullName: "", facultyNumber: "", department: "", email: "", password: "", confirmPassword: "",
};

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof SignUpForm) {
    return (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const passwordError = getPasswordError(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!accepted) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await createClient().auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/faculty/sign-in`,
        data: {
          role: "faculty",
          full_name: form.fullName,
          faculty_number: form.facultyNumber,
          department: form.department,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.push("/faculty/account-created");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/sign-in">
      <form className={styles.page} onSubmit={handleSubmit}>
        <PageHeading title="Create Account" subtitle="Fill in your information to get started." />
        <div className={styles.form}>
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
          <FormField label="Faculty ID" name="facultyNumber" value={form.facultyNumber} onChange={updateField("facultyNumber")} placeholder="Enter your faculty ID" required />
          <FormField label="Department" name="department" value={form.department} onChange={updateField("department")} placeholder="Enter your department" required />
          <FormField label="Email" name="email" value={form.email} onChange={updateField("email")} placeholder="you@school.edu" type="email" required />
          <PasswordField label="Password" name="password" value={form.password} onChange={updateField("password")} placeholder="Create a password" autoComplete="new-password" minLength={8} required />
          <p className={styles.passwordHint}>{passwordRequirementText}</p>
          <PasswordField label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={updateField("confirmPassword")} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} required />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>I agree to the Terms and Privacy Policy</span>
          </label>
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Creating Account..." : "Create Account"}</button>
        <p className={styles.formNote}>Already have an account? <Link href="/faculty/sign-in">Sign In</Link></p>
      </form>
    </MobileLayout>
  );
}
