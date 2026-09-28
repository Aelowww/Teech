"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./notification-bell.module.css";

export function NotificationBell({ href, className }: { href: string; className?: string }) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;

    async function watchNotifications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!profile || !active) return;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_profile_id", profile.id)
        .eq("is_read", false);
      if (active) setHasUnread((count || 0) > 0);

      channel = supabase
        .channel(`notifications-${profile.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_profile_id=eq.${profile.id}` },
          () => setHasUnread(true),
        )
        .subscribe();
    }

    void watchNotifications();
    return () => {
      active = false;
      if (channel) void createClient().removeChannel(channel);
    };
  }, []);

  return (
    <Link className={`${styles.bell} ${className || ""}`} href={href} aria-label={hasUnread ? "Notifications, unread updates" : "Notifications"}>
      <Bell size={19} />
      {hasUnread && <span className={styles.unread} aria-hidden="true" />}
    </Link>
  );
}
