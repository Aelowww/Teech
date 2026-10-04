"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader, FormCard, MobileLayout, Notice, FormField } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { OtpModal } from "@/app/mobile/_components/otp-modal";
import { isValidEmail, resendConfirmation, signUpStudent, verifyEmailCode } from "@/lib/auth-flows";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import { SupportChat } from "@/app/mobile/_components/support-chat";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./page.module.css";

type SignUpForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: SignUpForm = {
  fullName: "", email: "", password: "", confirmPassword: "",
};

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

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

    void createAccount();
  }

  async function createAccount() {
    setSubmitting(true);
    const result = await signUpStudent(form);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!result.needsCode) {
      router.push("/student/account-created");
      return;
    }
    setPendingEmail(form.email.trim().toLowerCase());
  }

  async function verifyCode(code: string) {
    const verifyError = await verifyEmailCode(pendingEmail, code);
    if (verifyError) return verifyError;
    router.push("/student/account-created");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <form className={styles.page} onSubmit={handleSubmit}>
        <BrandHeader />
        <FormCard>
        <div className={styles.form}>
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
          <FormField label="Email" name="email" value={form.email} onChange={updateField("email")} placeholder="Enter your email" type="email" required />
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
      <OtpModal open={Boolean(pendingEmail)} email={pendingEmail} onCancel={() => setPendingEmail("")} onVerify={verifyCode} onResend={() => resendConfirmation("student", pendingEmail)} />
    </MobileLayout>
  );
}
