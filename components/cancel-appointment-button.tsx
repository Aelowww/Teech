"use client";

import { Ban } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import styles from "./cancel-appointment-button.module.css";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function cancelAppointment() {
    setError("");
    setSaving(true);
    const { error: cancelError } = await createClient()
      .from("appointment_requests")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);
    setSaving(false);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    router.replace("/student/appointment-requests");
    router.refresh();
  }

  return (
    <>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.cancelButton} type="button" onClick={() => setConfirming(true)}><Ban size={15} />Cancel Consultation</button>
      <ConfirmationModal open={confirming} title="Cancel consultation?" description="This will cancel the consultation and notify the faculty member." confirmLabel={saving ? "Cancelling..." : "Cancel Consultation"} tone="danger" onCancel={() => setConfirming(false)} onConfirm={cancelAppointment} />
    </>
  );
}
