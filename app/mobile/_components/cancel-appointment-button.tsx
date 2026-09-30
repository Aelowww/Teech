"use client";

import { Ban } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./cancel-appointment-button.module.css";

export function CancelAppointmentButton({ appointmentId, role, quiet = false }: { appointmentId: string; role: "student" | "faculty"; quiet?: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function cancelAppointment() {
    const { data: cancelled, error: cancelError } = await createClient()
      .from("appointment_requests")
      .update({ status: "cancelled" })
      .eq("id", appointmentId)
      .in("status", role === "faculty" ? ["confirmed"] : ["pending", "confirmed"])
      .select("id");
    if (cancelError) return cancelError.message;
    if (!cancelled?.length) {
      router.refresh();
      return "This consultation can no longer be cancelled.";
    }
    if (role === "student") router.replace("/student/appointment-requests");
    router.refresh();
  }

  return (
    <>
      <button className={quiet ? styles.quiet : `${buttonStyles.button} ${buttonStyles.danger} ${styles.cancelButton}`} type="button" onClick={() => setConfirming(true)}><Ban size={quiet ? 14 : 15} />{quiet ? "Cancel consultation" : "Cancel Consultation"}</button>
      <ConfirmationModal
        open={confirming}
        title="Cancel consultation?"
        description={role === "faculty" ? "This will cancel the consultation and notify the student." : "This will cancel the consultation and notify the faculty member."}
        confirmLabel="Cancel Consultation"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={cancelAppointment}
      />
    </>
  );
}
