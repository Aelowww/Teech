"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/realtime";

export function useRealtimeRefresh(tables: string, onChange: () => void | Promise<void>) {
  const callback = useRef(onChange);

  useEffect(() => {
    callback.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const trigger = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void callback.current(), 400);
    };
    const channel = supabase.channel(uniqueChannelName("admin-live"));
    tables.split(",").forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table: table.trim() }, trigger);
    });
    channel.subscribe();
    const poll = window.setInterval(() => { if (!document.hidden) void callback.current(); }, 60000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [tables]);
}

export function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
}

export function relativeTime(value: string | null) {
  if (!value) return "Never";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
