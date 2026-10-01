"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ShieldAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./recovery-reminder.module.css";

const dismissKey = "teech.recovery-reminder-dismissed";

export function RecoveryReminder() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        if (window.sessionStorage.getItem(dismissKey)) return;
      } catch {
      }
      const { count, error } = await createClient().from("student_security_answers").select("question", { count: "exact", head: true });
      if (active && !error && (count ?? 0) < 3) setVisible(true);
    }
    void check();
    return () => { active = false; };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(dismissKey, "1");
    } catch {
    }
  }

  if (!visible) return null;

  return (
    <aside className={styles.reminder} role="status">
      <span className={styles.icon}><ShieldAlert size={18} /></span>
      <Link className={styles.body} href="/student/profile/security">
        <strong>Set up account recovery</strong>
        <small>Add security questions so you can reset your password if you forget it.</small>
      </Link>
      <Link className={styles.action} href="/student/profile/security" aria-label="Set up account recovery"><ChevronRight size={18} /></Link>
      <button className={styles.dismiss} type="button" onClick={dismiss} aria-label="Remind me later"><X size={14} /></button>
    </aside>
  );
}
