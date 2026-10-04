"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader, FormCard, MobileLayout, Notice, FormField } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { UserPlus } from "lucide-react";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { isValidEmail, resendConfirmation, signUpStudent, verifyStudentCode } from "@/lib/auth-flows";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import { SupportChat } from "@/app/mobile/_components/support-chat";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

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
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeNote, setCodeNote] = useState("");

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
    const result = await signUpStudent(form);
    if (result.error) {
      setSubmitting(false);
      return result.error;
    }
    if (!result.needsCode) {
      router.push("/student/account-created");
      return;
    }
    setSubmitting(false);
    setConfirming(false);
    setError("");
    setPendingEmail(form.email.trim().toLowerCase());
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCodeNote("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    const verifyError = await verifyStudentCode(pendingEmail, code);
    if (verifyError) {
      setSubmitting(false);
      setError(verifyError);
      return;
    }
    router.push("/student/account-created");
  }

  async function resendCode() {
    setError("");
    const resendError = await resendConfirmation("student", pendingEmail);
    setCodeNote(resendError || `We sent a new code to ${pendingEmail}.`);
  }

  if (pendingEmail) {
    return (
      <MobileLayout className={styles.screen} backTo="/student/sign-in">
        <form className={styles.page} onSubmit={verifyCode}>
          <BrandHeader />
          <FormCard>
          <div className={styles.form}>
            <p className={styles.codeIntro}><strong>Check your email</strong>We sent a 6-digit code to {pendingEmail}. Enter it to finish creating your account.</p>
            <FormField label="Verification code" name="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter the 6-digit code" inputMode="numeric" pattern="\d{6}" maxLength={6} required />
          </div>
          {error && <Notice error>{error}</Notice>}
          {codeNote && <Notice>{codeNote}</Notice>}
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={submitting}>{submitting ? "Verifying..." : "Verify and Create Account"}</button>
          <p className={styles.formNote}>Didn&apos;t get it? <button className={styles.textButton} type="button" onClick={resendCode}>Resend code</button></p>
        </FormCard>
        </form>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <form className={styles.page} onSubmit={handleSubmit}>
        <BrandHeader />
        <FormCard>
        <div className={styles.form}>
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
          <FormField label="Email" name="email" value={form.email} onChange={updateField("email")} placeholder="Enter your email" type="email" required />
          <FormField label="Student ID" name="studentNumber" value={form.studentNumber} onChange={(event) => setForm((current) => ({ ...current, studentNumber: onlyDigits(event.target.value) }))} placeholder="Enter your student ID" inputMode="numeric" pattern="\d{6}" maxLength={6} required />
          <FormField label="Course and Year" name="courseYear" value={form.courseYear} onChange={updateField("courseYear")} placeholder="Enter your course and year" required />
          <PasswordField label="Password" name="password" value={form.password} onChange={updateField("password")} placeholder="Create a password" autoComplete="new-password" minLength={8} required />
          <p className={styles.passwordHint}>{passwordRequirementText}</p>
          <PasswordField label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={updateField("confirmPassword")} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} required />
          <label className={styles.checkbox}>
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>I agree to the Terms and Privacy Policy</span>
          </label>
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.submitButton}`} type="submit" disabled={submitting}>{submitting ? "Creating Account..." : "Create Account"}</button>
        <p className={styles.formNote}>Already have an account? <Link href="/student/sign-in">Sign In</Link></p>
      </FormCard>
      <SupportChat audience="guest" variant="link" />
      </form>
      <ConfirmationModal open={confirming} title="Create your account?" description="Please confirm that your details are correct." confirmLabel="Create Account" icon={UserPlus} onCancel={() => setConfirming(false)} onConfirm={createAccount} />
    </MobileLayout>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}
