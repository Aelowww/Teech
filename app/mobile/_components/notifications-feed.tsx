"use client";

import { Award, Ban, Bell, CalendarCheck, CalendarX, Hourglass, Inbox, PartyPopper, Send, UserCheck, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { ShowMoreButton, useShowMore } from "@/app/mobile/_components/show-more";
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
        .order("created_at", { ascending: false })
        .limit(50);
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

  const list = useShowMore(notifications, 6);

  if (isLoading) return <AppLoader />;

  return (
    <MobileLayout className={styles.screen} backTo={`/${role}/home`} role={role}>
      <div className={styles.page}>
        <PageHeading title="Notifications" subtitle="Stay updated on your account and consultations." />
        {error && <Notice error>{error}</Notice>}
        {notifications.length ? (
          <div className={styles.updates}>
            {list.visible.map((notification) => {
              const { Icon, tone } = appearanceFor(notification.kind);
              return <article key={notification.id}><span className={`${styles.icon} ${styles[tone]}`}><Icon size={17} /></span><div><strong>{notification.title}</strong><span>{notification.body}</span><small>{formatTimestamp(notification.created_at)}</small></div></article>;
            })}
            <ShowMoreButton remaining={list.remaining} canCollapse={list.canCollapse} onShowMore={list.showMore} onShowLess={list.showLess} />
          </div>
        ) : <p className={styles.empty}>No notifications yet.</p>}
      </div>
    </MobileLayout>
  );
}

type Tone = "accent" | "success" | "danger" | "warning";

const appearances: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  account_created: { Icon: UserCheck, tone: "accent" },
  welcome: { Icon: PartyPopper, tone: "accent" },
  request_submitted: { Icon: Send, tone: "accent" },
  request_received: { Icon: Inbox, tone: "accent" },
  request_confirmed: { Icon: CalendarCheck, tone: "success" },
  request_declined: { Icon: CalendarX, tone: "danger" },
  request_cancelled: { Icon: Ban, tone: "danger" },
  request_expired: { Icon: Hourglass, tone: "warning" },
  badge_earned: { Icon: Award, tone: "accent" },
};

function appearanceFor(kind: string) {
  return appearances[kind] || { Icon: Bell, tone: "accent" as Tone };
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }) });
}
