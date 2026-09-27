"use client";

import { CheckCircle2, CircleAlert, Send, Sparkles, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/components/app-loader";
import styles from "./notifications-feed.module.css";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsFeed({ role }: { role: "student" | "faculty" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    const supabase = createClient();

    async function markRead(ids: string[]) {
      if (!ids.length) return;
      await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    }

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) {
        if (active) setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!profile || !active) {
        if (active) setIsLoading(false);
        return;
      }

      const { data, error: notificationError } = await supabase
        .from("notifications")
        .select("id, kind, title, body, is_read, created_at")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (notificationError) {
        setError(notificationError.message);
        setIsLoading(false);
        return;
      }

      const loaded = (data || []) as Notification[];
      setNotifications(loaded.map((notification) => ({ ...notification, is_read: true })));
      void markRead(loaded.filter((notification) => !notification.is_read).map((notification) => notification.id));
      setIsLoading(false);

      channel = supabase
        .channel(`notification-feed-${profile.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_profile_id=eq.${profile.id}` },
          (payload) => {
            const notification = payload.new as Notification;
            setNotifications((current) => [{ ...notification, is_read: true }, ...current]);
            void markRead([notification.id]);
          },
        )
        .subscribe();
    }

    void loadNotifications();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <AppLoader />;

  return (
    <MobileLayout className={styles.screen} backTo={`/${role}/home`} role={role}>
      <div className={styles.page}>
        <PageHeading title="Notifications" subtitle="Stay updated on your account and consultations." />
        {error && <Notice error>{error}</Notice>}
        {notifications.length ? (
          <div className={styles.updates}>
            {notifications.map((notification) => {
              const Icon = iconFor(notification.kind);
              return <article key={notification.id}><span className={styles.icon}><Icon size={17} /></span><div><strong>{notification.title}</strong><span>{notification.body}</span><small>{formatTimestamp(notification.created_at)}</small></div></article>;
            })}
          </div>
        ) : <p className={styles.empty}>No notifications yet.</p>}
      </div>
    </MobileLayout>
  );
}

function iconFor(kind: string) {
  if (kind === "account_created" || kind === "welcome") return Sparkles;
  if (kind === "request_submitted" || kind === "request_received") return Send;
  if (kind === "request_confirmed") return CheckCircle2;
  if (kind === "request_declined" || kind === "request_cancelled") return XCircle;
  return CircleAlert;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
