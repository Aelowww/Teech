"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { UserPlus } from "lucide-react";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { IdUploadField } from "@/app/desktop/_components/id-upload-field";
import { isValidEmail, signUpFaculty } from "@/lib/auth-flows";
import { facultyIdFileError } from "@/lib/faculty-id";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import { SupportChat } from "@/app/desktop/_components/support-chat";
import styles from "@/app/desktop/_components/auth.module.css";

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
  const [confirming, setConfirming] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);

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
    if (!form.facultyNumber.trim() || form.facultyNumber.trim().length > 32) {
      setError("Enter your Faculty ID (up to 32 characters).");
      return;
    }
    const fileError = facultyIdFileError(idFile);
    if (fileError) {
      setError(fileError);
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
    const signUpError = await signUpFaculty({ ...form, idFile });
    if (signUpError) {
      setSubmitting(false);
      return signUpError;
    }
    router.push("/faculty/account-created");
  }

  return (
    <AuthFrame onSubmit={handleSubmit} backTo="/faculty/sign-in" wide below={<SupportChat audience="guest" variant="link" />}>
      <div className={`${styles.form} ${styles.formColumns}`}>
        <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateField("fullName")} placeholder="Enter your full name" required />
        <FormField label="Faculty ID" name="facultyNumber" value={form.facultyNumber} onChange={updateField("facultyNumber")} placeholder="Enter your faculty ID" required />
        <FormField label="Department" name="department" value={form.department} onChange={updateField("department")} placeholder="Enter your department" required />
        <FormField label="Email" name="email" value={form.email} onChange={updateField("email")} placeholder="you@school.edu" type="email" required />
        <div className={styles.fullRow}>
          <IdUploadField label="Faculty ID Photo" file={idFile} onChange={(file) => { setError(""); setIdFile(file); }} />
        </div>
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
      <p className={styles.formNote}>Already have an account? <Link href="/faculty/sign-in">Sign in</Link></p>
      <ConfirmationModal open={confirming} title="Create your account?" description={`You are signing up as ${form.fullName} with Faculty ID ${form.facultyNumber.trim()} and email ${form.email.trim()}. Your Faculty ID photo will be reviewed by an admin before you can sign in.`} confirmLabel="Create Account" icon={UserPlus} onCancel={() => setConfirming(false)} onConfirm={createAccount} />
    </AuthFrame>
  );
}
