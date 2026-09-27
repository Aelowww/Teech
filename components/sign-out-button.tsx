"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./ui.module.css";

export function SignOutButton({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  async function signOut() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    await createClient().auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return <button className={`${styles.action} ${styles.actionDanger}`} type="button" onClick={signOut}>Sign Out <LogOut size={16} /></button>;
}
