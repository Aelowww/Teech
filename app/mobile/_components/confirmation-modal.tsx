"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import styles from "./confirmation-modal.module.css";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  confirmationText?: string;
  onCancel: () => void;
  onConfirm: () => Promise<string | void> | string | void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  confirmationText,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dismiss = useCallback(() => {
    setTypedText("");
    setError("");
    setSubmitting(false);
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismiss, open, submitting]);

  if (!open) return null;

  async function confirm() {
    if (confirmationText && typedText !== confirmationText) {
      setError(`Type ${confirmationText} to continue.`);
      return;
    }

    setError("");
    setSubmitting(true);
    const result = await onConfirm();
    setSubmitting(false);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    dismiss();
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={() => !submitting && dismiss()}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`${styles.icon} ${tone === "danger" ? styles.iconDanger : ""}`}>
          {tone === "danger" ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        </div>
        <button className={styles.close} type="button" onClick={dismiss} disabled={submitting} aria-label="Close confirmation"><X size={17} /></button>
        <h2 id="confirmation-title">{title}</h2>
        <p id="confirmation-description">{description}</p>
        {confirmationText && (
          <label className={styles.confirmationField}>
            <span>Type {confirmationText} to confirm</span>
            <input value={typedText} onChange={(event) => setTypedText(event.target.value)} autoComplete="off" disabled={submitting} />
          </label>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={dismiss} disabled={submitting}>Cancel</button>
          <button className={`${styles.confirm} ${tone === "danger" ? styles.confirmDanger : ""}`} type="button" onClick={confirm} disabled={submitting}>{submitting ? "Please wait..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
