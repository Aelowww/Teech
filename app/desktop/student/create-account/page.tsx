"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { UserPlus } from "lucide-react";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { isValidEmail, signUpStudent } from "@/lib/auth-flows";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import { SupportChat } from "@/app/desktop/_components/support-chat";
import styles from "@/app/desktop/_components/auth.module.css";

type SignUpForm = {
  fullName: string;
  email: string;
  studentNumber: string;
  courseYear: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: SignUpForm = {
  fullName: "", email: "", studentNumber: "", courseYear: "", password: "", confirmPassword: "",
};

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function updateField(field: keyof SignUpForm) {
    return (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isValidEmail(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
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

    setConfirming(true);
  }

  async function createAccount() {
    setSubmitting(true);
    const signUpError = await signUpStudent(form);
    if (signUpError) {
      setSubmitting(false);
      return signUpError;
    }
    router.push("/student/account-created");
  }

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/student/sign-in" wide below={<SupportChat audience="guest" variant="link" />}>
      <div className={`${styles.form} ${styles.formColumns}`}>
        <div className={styles.fullRow}>
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
        </div>
        <div className={styles.fullRow}>
          <FormField label="Email" name="email" value={form.email} onChange={updateField("email")} placeholder="you@school.edu" type="email" required />
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
      <ConfirmationModal open={confirming} title="Create your account?" description={`You are signing up as ${form.fullName} with Student ID ${form.studentNumber} and email ${form.email.trim()}. Make sure these details are correct.`} confirmLabel="Create Account" icon={UserPlus} onCancel={() => setConfirming(false)} onConfirm={createAccount} />
    </AuthFrame>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}
