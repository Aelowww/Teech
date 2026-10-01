"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CircleHelp, type LucideIcon } from "lucide-react";
import buttonStyles from "./button.module.css";
import styles from "./confirmation-modal.module.css";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
<<<<<<< HEAD
  tone?: "default" | "danger";
  /** Icon for the action, e.g. LogOut for signing out. Defaults to a warning (danger) or a question mark. */
  icon?: LucideIcon;
  confirmationText?: string;
=======
  tone?: "default" | "danger" | "success";
  icon?: LucideIcon;
  confirmationText?: string;
  hideCancel?: boolean;
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
  onCancel: () => void;
  onConfirm: () => Promise<string | void> | string | void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  icon,
  confirmationText,
<<<<<<< HEAD
=======
  hideCancel = false,
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

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

  const Icon = icon || (tone === "danger" ? AlertTriangle : CircleHelp);

<<<<<<< HEAD
  // Rendered at the top of the page so it never picks up styles from wherever the trigger sits.
  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={() => !submitting && dismiss()}>
      <section
        className={`${styles.dialog} ${tone === "danger" ? styles.danger : ""}`}
=======
  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={() => !submitting && dismiss()}>
      <section
        className={`${styles.dialog} ${tone === "danger" ? styles.danger : tone === "success" ? styles.success : ""}`}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className={styles.icon} aria-hidden="true"><Icon size={22} /></span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        {confirmationText && (
          <label className={styles.confirmationField}>
            <span>Type <b>{confirmationText}</b> to confirm</span>
            <input value={typedText} onChange={(event) => setTypedText(event.target.value)} autoComplete="off" autoCapitalize="characters" disabled={submitting} />
          </label>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
<<<<<<< HEAD
          <button className={`${buttonStyles.button} ${buttonStyles.block} ${styles.cancel}`} type="button" onClick={dismiss} disabled={submitting}>Cancel</button>
=======
          {!hideCancel && <button className={`${buttonStyles.button} ${buttonStyles.block} ${styles.cancel}`} type="button" onClick={dismiss} disabled={submitting}>Cancel</button>}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block} ${tone === "danger" ? styles.confirmDanger : ""}`} type="button" onClick={confirm} disabled={submitting} autoFocus>{submitting ? "Please wait..." : confirmLabel}</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
