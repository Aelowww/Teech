"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile-settings.module.css";

export function SignOutEverywhere({ role }: { role: "student" | "faculty" }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function signOutEverywhere() {
    const { error } = await createClient().auth.signOut({ scope: "global" });
    if (error) return error.message;
    router.replace(`/${role}/sign-in`);
    router.refresh();
  }

  return (
    <section className={styles.securityCard}>
      <h2><MonitorSmartphone size={15} />Active sessions</h2>
      <p>Lost a phone or used a shared computer? Sign out everywhere, including this device.</p>
      <button className={styles.textAction} type="button" onClick={() => setConfirming(true)}>Sign out of all devices</button>
      <ConfirmationModal open={confirming} title="Sign out of all devices?" description="You'll need your password to sign in again on every device." confirmLabel="Sign Out Everywhere" tone="danger" onCancel={() => setConfirming(false)} onConfirm={signOutEverywhere} />
    </section>
  );
}
