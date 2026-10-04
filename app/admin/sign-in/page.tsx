"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, FormField } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { AuthFrame, AuthSubmit } from "@/app/desktop/_components/auth-frame";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import authStyles from "@/app/desktop/_components/auth.module.css";
import styles from "../admin.module.css";

type Step =
  | { kind: "loading" }
  | { kind: "credentials" }
  | { kind: "enroll"; factorId: string; qrCode: string; secret: string }
  | { kind: "challenge"; factorId: string };

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function resume() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setStep({ kind: "credentials" });
        return;
      }
      const { data: status } = await supabase.rpc("my_admin_status");
      if (!active) return;
      if (status === "ok") {
        router.replace("/admin");
        return;
      }
      if (status === "needs_mfa") {
        const next = await secondFactorStep();
        if (active) setStep(next.step ?? { kind: "credentials" });
        if (active && next.error) setError(next.error);
        return;
      }
      setStep({ kind: "credentials" });
    }
    void resume();
    return () => { active = false; };
  }, [router]);

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (signInError) {
      setSubmitting(false);
      setError(signInError.code === "invalid_credentials" ? "Incorrect email or password." : signInError.message);
      return;
    }
    const { data: status } = await supabase.rpc("my_admin_status");
    if (status !== "ok" && status !== "needs_mfa") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This account doesn't have admin access.");
      return;
    }
    if (status === "ok") {
      router.replace("/admin");
      router.refresh();
      return;
    }
    const next = await secondFactorStep();
    setSubmitting(false);
    setPassword("");
    if (next.error) setError(next.error);
    if (next.step) setStep(next.step);
  }

  async function handleCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind !== "enroll" && step.kind !== "challenge") return;
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: step.factorId, code: code.trim() });
    if (verifyError) {
      setSubmitting(false);
      setCode("");
      setError(verifyError.code === "mfa_verification_failed" ? "That code didn't match. Check your authenticator app and try again." : verifyError.message);
      return;
    }
    const { data: status } = await supabase.rpc("my_admin_status");
    if (status !== "ok") {
      await supabase.auth.signOut();
      setSubmitting(false);
      setStep({ kind: "credentials" });
      setError("This account doesn't have admin access.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function cancel() {
    await createClient().auth.signOut();
    setCode("");
    setError("");
    setStep({ kind: "credentials" });
  }

  if (step.kind === "loading") return <AppLoader />;

  if (step.kind === "credentials") {
    return (
      <AuthFrame onSubmit={handleCredentials} backTo="/welcome">
        <div className={authStyles.form}>
          <p className={styles.authLead}>Admin sign in</p>
          <FormField label="Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@school.edu" type="email" required />
          <PasswordField label="Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
        </div>
        {error && <Notice error>{error}</Notice>}
        <AuthSubmit label="Continue" pendingLabel="Checking…" pending={submitting} />
        <p className={authStyles.formNote}>Admin accounts are protected with two-step verification.</p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame onSubmit={handleCode} backTo="/welcome">
      <div className={authStyles.form}>
        <p className={styles.authLead}>{step.kind === "enroll" ? "Set up two-step verification" : "Two-step verification"}</p>
        {step.kind === "enroll" ? (
          <div className={styles.enroll}>
            <p>Scan this QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy), then enter the 6-digit code it shows.</p>
            <Image className={styles.qr} src={step.qrCode} alt="Authenticator QR code" width={180} height={180} unoptimized />
            <p className={styles.secret}>Can&apos;t scan? Enter this key: <code>{step.secret}</code></p>
          </div>
        ) : (
          <p className={styles.authHint}>Enter the 6-digit code from your authenticator app.</p>
        )}
        <FormField label="Authentication code" name="code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" inputMode="numeric" pattern="\d{6}" maxLength={6} required />
      </div>
      {error && <Notice error>{error}</Notice>}
      <AuthSubmit label="Verify" pendingLabel="Verifying…" pending={submitting} />
      <p className={authStyles.formNote}><button className={authStyles.textButton} type="button" onClick={cancel}>Use a different account</button></p>
    </AuthFrame>
  );
}

async function secondFactorStep(): Promise<{ step?: Step; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { error: error.message };

  const verified = data.all.find((factor) => factor.factor_type === "totp" && factor.status === "verified");
  if (verified) return { step: { kind: "challenge", factorId: verified.id } };

  for (const factor of data.all) {
    if (factor.factor_type === "totp" && factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Teech admin ${new Date().toISOString().slice(0, 10)}` });
  if (enrollError || !enrolled) return { error: enrollError?.message || "Couldn't start two-step verification setup." };
  return { step: { kind: "enroll", factorId: enrolled.id, qrCode: enrolled.totp.qr_code, secret: enrolled.totp.secret } };
}
