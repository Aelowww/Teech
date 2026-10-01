"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { Check } from "lucide-react";
import { getPasswordError, passwordRules } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import { SuccessModal } from "./success-modal";
import styles from "./profile-settings.module.css";
import formStyles from "./change-password-form.module.css";

type Role = "student" | "faculty";

export function ChangePasswordForm({ role }: { role: Role }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const profilePath = `/${role}/profile`;
  const metCount = passwordRules.filter((rule) => rule.test(password)).length;
  const matches = confirmation.length > 0 && confirmation === password;

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
    if (updateError) {
      if (updateError.name === "AuthSessionMissingError" || updateError.code === "session_not_found") {
        await createClient().auth.signOut({ scope: "local" });
        router.replace(`/${role}/sign-in`);
        return "Your session expired. Please sign in again.";
      }
      return updateError.message;
    }
    setSaved(true);
  }

  function finishSave() {
    setSaved(false);
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
        <div className={formStyles.form}>
          <PasswordField label="New Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" autoComplete="new-password" minLength={8} required />
          <div className={formStyles.strength} aria-hidden="true">
            {passwordRules.map((rule, index) => <i key={rule.id} className={index < metCount ? formStyles[`level${Math.min(metCount, 5)}`] : ""} />)}
          </div>
          <ul className={formStyles.rules} aria-label="Password requirements">
            {passwordRules.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.id} className={met ? formStyles.met : ""}>
                  <span aria-hidden="true">{met && <Check size={10} strokeWidth={3.5} />}</span>
                  {rule.label}<span className={formStyles.srOnly}>{met ? " (done)" : ""}</span>
                </li>
              );
            })}
          </ul>
          <PasswordField label="Confirm New Password" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter your new password" autoComplete="new-password" minLength={8} required />
          {confirmation.length > 0 && (
            <p className={`${formStyles.match} ${matches ? formStyles.matchOk : ""}`} aria-live="polite">
              {matches ? <><Check size={13} strokeWidth={3} aria-hidden="true" />Passwords match</> : "Passwords don't match yet"}
            </p>
          )}
        </div>
        {error && <Notice error>{error}</Notice>}
        <div className={formStyles.submit}><button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button></div>
      </form>
      <ConfirmationModal open={confirming} title="Update password?" description="Your new password will replace the current one for this account." confirmLabel="Update Password" onCancel={() => setConfirming(false)} onConfirm={changePassword} />
      <SuccessModal open={saved} title="Password changed" description="Use your new password the next time you sign in." onDone={finishSave} />
    </MobileLayout>
  );
}
