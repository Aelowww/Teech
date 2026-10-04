"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { avatarBucket } from "@/lib/avatar";
import { clearAppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import styles from "./delete-account-button.module.css";

export function DeleteAccountButton({ role, className }: { role: "student" | "faculty"; className?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function deleteAccount() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace(`/${role}/sign-in`); return; }

    const { data: profile } = await supabase.from("profiles").select("avatar_path").eq("auth_user_id", user.id).maybeSingle();
    if (profile?.avatar_path) await supabase.storage.from(avatarBucket).remove([profile.avatar_path]);

    const { error } = await supabase.rpc("delete_my_account");
    if (error) return error.message;

    await supabase.auth.signOut({ scope: "local" });
    clearAppointmentDraft();
    router.replace("/splash");
    router.refresh();
  }

  return (
    <>
      <button className={`${className || ""} ${styles.deleteButton}`} type="button" onClick={() => setConfirming(true)}><span><Trash2 size={15} />Delete Account</span><ChevronRight size={16} /></button>
      <ConfirmationModal icon={Trash2}
        open={confirming}
        title="Are you sure you want to delete your account?"
        description={role === "faculty"
          ? "This permanently deletes your profile, availability, and consultation history. Students with upcoming consultations will be notified that they were cancelled."
          : "This permanently deletes your profile, requests, and consultation history. Faculty with upcoming consultations will be notified that they were cancelled."}
        confirmationText="DELETE"
        confirmLabel="Delete Account"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={deleteAccount}
      />
    </>
  );
}
