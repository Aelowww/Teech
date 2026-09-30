"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "./button.module.css";
import styles from "./request-decision-buttons.module.css";

type Decision = "confirmed" | "declined";

export function RequestDecisionButtons({ requestId, canConfirm = true }: { requestId: string; canConfirm?: boolean }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);

  async function saveDecision() {
    if (!decision) return;
    const { data: updated, error } = await createClient()
      .from("appointment_requests")
      .update({ status: decision })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id");
    if (error) return error.message;
    if (!updated?.length) return "This request is no longer pending. Refresh to see its latest status.";
    router.refresh();
  }

  return (
    <>
      <div className={`${styles.actions} ${canConfirm ? "" : styles.single}`}>
        <button className={`${buttonStyles.button} ${buttonStyles.danger} ${buttonStyles.block}`} type="button" onClick={() => setDecision("declined")}><X size={15} />Decline</button>
        {canConfirm && <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block}`} type="button" onClick={() => setDecision("confirmed")}><Check size={15} />Confirm</button>}
      </div>
      <ConfirmationModal
        open={Boolean(decision)}
        title={decision === "confirmed" ? "Confirm request?" : "Decline request?"}
        description={decision === "confirmed" ? "The student will see that their consultation has been confirmed." : "The student will see that their consultation request was declined."}
        confirmLabel={decision === "confirmed" ? "Confirm Request" : "Decline Request"}
        tone={decision === "declined" ? "danger" : "default"}
        onCancel={() => setDecision(null)}
        onConfirm={saveDecision}
      />
    </>
  );
}
