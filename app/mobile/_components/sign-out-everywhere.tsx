"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MonitorSmartphone } from "lucide-react";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { clearAppointmentDraft } from "@/lib/local-appointments";
import styles from "./sign-out-everywhere.module.css";

export function SignOutEverywhere() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function signOutEverywhere() {
    const { error } = await createClient().auth.signOut({ scope: "global" });
    if (error) return error.message;
    clearAppointmentDraft();
    router.replace("/welcome");
    router.refresh();
  }

  return (
    <section className={styles.section} aria-label="Active sessions">
      <h2>Active sessions</h2>
      <button className={styles.row} type="button" onClick={() => setConfirming(true)}>
        <MonitorSmartphone className={styles.icon} size={16} aria-hidden="true" />
        <span>
          <strong>Sign out of all devices</strong>
          <small>Lost a phone or used a shared computer? This signs you out everywhere, including here.</small>
        </span>
        <ChevronRight className={styles.chevron} size={16} aria-hidden="true" />
      </button>
      <ConfirmationModal icon={MonitorSmartphone} open={confirming} title="Sign out of all devices?" description="You'll need your password to sign in again on every device." confirmLabel="Sign Out Everywhere" tone="danger" onCancel={() => setConfirming(false)} onConfirm={signOutEverywhere} />
    </section>
  );
}
