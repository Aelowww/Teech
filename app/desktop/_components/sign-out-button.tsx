"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { clearAppointmentDraft } from "@/lib/local-appointments";
import buttonStyles from "./button.module.css";

export function SignOutButton({ redirectTo, variant = "button", className }: { redirectTo: string; variant?: "button" | "row"; className?: string }) {
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
    {variant === "row"
      ? <button className={className} type="button" onClick={() => setConfirming(true)}><span><LogOut size={15} />Sign Out</span></button>
      : <button className={`${buttonStyles.button} ${buttonStyles.danger}`} type="button" onClick={() => setConfirming(true)}>Sign Out <LogOut size={16} /></button>}
    <ConfirmationModal open={confirming} title="Sign out?" description="You'll need your ID and password to sign back in." confirmLabel="Sign Out" icon={LogOut} onCancel={() => setConfirming(false)} onConfirm={signOut} />
  </>;
}
