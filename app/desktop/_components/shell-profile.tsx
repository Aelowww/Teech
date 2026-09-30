"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signedAvatarUrl } from "@/lib/avatar";
import styles from "./app-shell.module.css";

type Identity = { name: string; subtitle: string; avatarSrc: string | null };

// Sidebar profile card. Uses the values the page passes in, or loads the signed-in profile when they are missing.
export function ShellProfile({
  role,
  name,
  subtitle,
  avatarSrc,
}: {
  role: "student" | "faculty";
  name?: string;
  subtitle?: string;
  avatarSrc?: string | null;
}) {
  const provided = name !== undefined;
  const [loaded, setLoaded] = useState<Identity | null>(null);

  useEffect(() => {
    if (provided) return;
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, course_year, department, avatar_path")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!profile || !active) return;
      const photo = await signedAvatarUrl(supabase, profile.avatar_path);
      if (!active) return;
      const detail = role === "student" ? profile.course_year : profile.department;
      setLoaded({
        name: profile.full_name || "",
        subtitle: detail ? `${role === "student" ? "Student" : "Faculty"} • ${detail}` : role === "student" ? "Student" : "Faculty",
        avatarSrc: photo,
      });
    }
    void load();
    return () => { active = false; };
  }, [provided, role]);

  const identity: Identity = provided
    ? { name: name || "", subtitle: subtitle || "", avatarSrc: avatarSrc || null }
    : loaded || { name: "", subtitle: "", avatarSrc: null };

  return (
    <div className={styles.profileCard}>
      <span className={styles.avatar}>
        {identity.avatarSrc ? <Image src={identity.avatarSrc} alt="" fill sizes="56px" unoptimized /> : <UserRound size={24} />}
      </span>
      <div>
        {identity.name ? <strong>{identity.name}</strong> : <span className={styles.skeleton} aria-hidden="true" />}
        <small>{identity.subtitle || (role === "student" ? "Student" : "Faculty")}</small>
      </div>
    </div>
  );
}
