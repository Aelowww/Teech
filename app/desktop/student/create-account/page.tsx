"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { createClient } from "@/lib/supabase/client";
import { studentAuthEmail } from "@/lib/student-auth";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import styles from "@/app/desktop/_components/auth.module.css";

type SignUpForm = {
  fullName: string;
  studentNumber: string;
  courseYear: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: SignUpForm = {
  fullName: "", studentNumber: "", courseYear: "", password: "", confirmPassword: "",
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
    if (!/^\d{6}$/.test(form.studentNumber)) {
      setError("Student ID must be exactly 6 digits.");
      return;
    }
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
      email: studentAuthEmail(form.studentNumber),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/student/sign-in`,
        data: {
          role: "student",
          full_name: form.fullName,
          student_number: form.studentNumber,
          course_year: form.courseYear,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    await createClient().auth.signOut();
    router.push("/student/account-created");
  }

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/student/sign-in" wide>
      <div className={`${styles.form} ${styles.formColumns}`}>
        <div className={styles.fullRow}>
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
        </div>
        <FormField label="Student ID" name="studentNumber" value={form.studentNumber} onChange={(event) => setForm((current) => ({ ...current, studentNumber: onlyDigits(event.target.value) }))} placeholder="Enter your student ID" inputMode="numeric" pattern="\d{6}" maxLength={6} required />
        <FormField label="Course and Year" name="courseYear" value={form.courseYear} onChange={updateField("courseYear")} placeholder="Enter your course and year" required />
        <PasswordField label="Password" name="password" value={form.password} onChange={updateField("password")} placeholder="Create a password" autoComplete="new-password" minLength={8} required />
        <PasswordField label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={updateField("confirmPassword")} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} required />
        <p className={styles.passwordHint}>{passwordRequirementText}</p>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>I agree to the Terms and Privacy Policy</span>
        </label>
      </div>
      {error && <Notice error>{error}</Notice>}
      <AuthSubmit label="Create account" pendingLabel="Creating account…" pending={submitting} />
      <p className={styles.formNote}>Already have an account? <Link href="/student/sign-in">Sign in</Link></p>
    </AuthFrame>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}
