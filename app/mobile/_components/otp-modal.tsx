"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { MailCheck } from "lucide-react";
import buttonStyles from "./button.module.css";
import modalStyles from "./confirmation-modal.module.css";
import styles from "./otp-modal.module.css";

type OtpModalProps = {
  open: boolean;
  email: string;
  onCancel: () => void;
  onVerify: (code: string) => Promise<string | void>;
  onResend: () => Promise<string | null>;
};

export function OtpModal({ open, email, onCancel, onVerify, onResend }: OtpModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onCancel]);

  useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [open, cooldown]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNote("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setSubmitting(true);
    const result = await onVerify(code);
    setSubmitting(false);
    if (typeof result === "string") {
      setError(result);
      setCode("");
    }
  }

  async function resend() {
    setError("");
    setCode("");
    const result = await onResend();
    if (!result) setCooldown(60);
    setNote(result || `We sent a new code to ${email}. Use this newest code, since earlier ones no longer work.`);
  }

  return createPortal(
    <div className={modalStyles.backdrop} role="presentation">
      <form className={modalStyles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onSubmit={submit}>
        <span className={modalStyles.icon} aria-hidden="true"><MailCheck size={22} /></span>
        <h2 id={titleId}>Verify your email</h2>
        <p id={descriptionId}>We sent a 6-digit code to <b>{email}</b>. Enter it below to create your account. It can take a minute to arrive, and only the most recent code works.</p>
        <label className={modalStyles.confirmationField}>
          <span>Verification code</span>
          <input
            className={styles.code}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the 6-digit code"
            maxLength={6}
            disabled={submitting}
            autoFocus
          />
        </label>
        {error && <p className={modalStyles.error} role="alert">{error}</p>}
        {note && <p className={styles.note} role="status">{note}</p>}
        <p className={styles.resend}>Didn&apos;t get it? <button type="button" onClick={resend} disabled={submitting || cooldown > 0}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</button></p>
        <div className={modalStyles.actions}>
          <button className={`${buttonStyles.button} ${buttonStyles.block} ${modalStyles.cancel}`} type="button" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block}`} type="submit" disabled={submitting}>{submitting ? "Verifying..." : "Submit"}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
