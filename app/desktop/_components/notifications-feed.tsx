"use client";

import { Award, Ban, Bell, CalendarCheck, CheckCheck, CalendarX, Hourglass, Inbox, PartyPopper, Send, UserCheck, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { ShowMoreButton, useShowMore } from "@/app/desktop/_components/show-more";
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
      setNotifications(loaded);
      setIsLoading(false);

      channel = supabase
        .channel(`notification-feed-${profile.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_profile_id=eq.${profile.id}` },
          (payload) => {
            const notification = payload.new as Notification;
            setNotifications((current) => [notification, ...current]);
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

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  async function markRead(ids: string[]) {
    if (!ids.length) return;
    setError("");
    setNotifications((current) => current.map((notification) => ids.includes(notification.id) ? { ...notification, is_read: true } : notification));
    const { error: updateError } = await createClient().from("notifications").update({ is_read: true }).in("id", ids);
    if (updateError) {
      setError(updateError.message);
      setNotifications((current) => current.map((notification) => ids.includes(notification.id) ? { ...notification, is_read: false } : notification));
    }
  }

  return (
    <DesktopLayout className={styles.screen} role={role} activeNav="notifications">
      <div className={styles.page}>
        <PageHeading title="Notifications" subtitle="Stay updated on your account and consultations." />
        {error && <Notice error>{error}</Notice>}
        {notifications.length > 0 && (
          <div className={styles.toolbar}>
            <span>{unreadCount ? `${unreadCount} unread` : "All caught up"}</span>
            {unreadCount > 0 && <button type="button" onClick={() => void markRead(notifications.filter((notification) => !notification.is_read).map((notification) => notification.id))}><CheckCheck size={14} />Mark all as read</button>}
          </div>
        )}
        {notifications.length ? (
          <div className={styles.updates}>
            {list.visible.map((notification) => {
              const { Icon, tone } = appearanceFor(notification.kind);
              return (
                <button className={`${styles.item} ${notification.is_read ? "" : styles.unread}`} type="button" key={notification.id} onClick={() => !notification.is_read && void markRead([notification.id])} aria-label={`${notification.title}${notification.is_read ? "" : ", unread"}`}>
                  <span className={`${styles.icon} ${styles[tone]}`}><Icon size={17} /></span>
                  <div><strong>{notification.title}</strong><span>{notification.body}</span><small>{formatTimestamp(notification.created_at)}</small></div>
                  {!notification.is_read && <i className={styles.dot} aria-hidden="true" />}
                </button>
              );
            })}
            <ShowMoreButton remaining={list.remaining} canCollapse={list.canCollapse} onShowMore={list.showMore} onShowLess={list.showLess} />
          </div>
        ) : <p className={styles.empty}>No notifications yet.</p>}
      </div>
    </DesktopLayout>
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
