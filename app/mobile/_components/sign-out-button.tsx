"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { clearAppointmentDraft } from "@/lib/local-appointments";
import styles from "./ui.module.css";

export function SignOutButton({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) return error.message;
    clearAppointmentDraft();
    router.replace(redirectTo);
    router.refresh();
  }

  return <>
    <button className={`${styles.action} ${styles.actionDanger}`} type="button" onClick={() => setConfirming(true)}>Sign Out <LogOut size={16} /></button>
    <ConfirmationModal open={confirming} title="Sign out?" description="You will need your account credentials to return to the portal." confirmLabel="Sign Out" onCancel={() => setConfirming(false)} onConfirm={signOut} />
  </>;
}
