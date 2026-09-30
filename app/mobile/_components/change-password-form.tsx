"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./profile-settings.module.css";

type Role = "student" | "faculty";

export function ChangePasswordForm({ role }: { role: Role }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const profilePath = `/${role}/profile`;

  function requestPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordError = getPasswordError(password);
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setError("");
    setConfirming(true);
  }

  async function changePassword() {
    setSaving(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (updateError) return updateError.message;
    router.replace(profilePath);
    router.refresh();
  }

  return (
    <MobileLayout
      className={styles.screen}
      backTo={profilePath}
      role={role === "faculty" ? "faculty" : "student"}
      activeNav="profile"
    >
      <form className={styles.page} onSubmit={requestPasswordChange}>
        <PageHeading title="Change Password" subtitle="Choose a new password for your account." />
        <div className={styles.form}>
          <PasswordField label="New Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" autoComplete="new-password" minLength={8} required />
          <p className={styles.passwordHint}>{passwordRequirementText}</p>
          <PasswordField label="Confirm New Password" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter your new password" autoComplete="new-password" minLength={8} required />
        </div>
        {error && <Notice error>{error}</Notice>}
        <div className={styles.submitArea}><button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button></div>
      </form>
      <ConfirmationModal open={confirming} title="Update password?" description="Your new password will replace the current one for this account." confirmLabel="Update Password" onCancel={() => setConfirming(false)} onConfirm={changePassword} />
    </MobileLayout>
  );
}
