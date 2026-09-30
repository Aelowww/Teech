"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { badgeIcon } from "@/app/desktop/_components/badge-icons";
import { createClient } from "@/lib/supabase/client";
import styles from "./badge-grid.module.css";

export type Badge = { id: string; name: string; description: string };

export function BadgeGrid({ badges, earnedIds, showcasedIds }: { badges: Badge[]; earnedIds: string[]; showcasedIds: string[] }) {
  const router = useRouter();
  const earned = new Set(earnedIds);
  const [showcased, setShowcased] = useState(showcasedIds);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  async function toggleShowcase(badgeId: string) {
    const show = !showcased.includes(badgeId);
    setError("");
    setSaving(badgeId);
    const { error: saveError } = await createClient().rpc("set_badge_showcase", { requested_badge_id: badgeId, show });
    setSaving("");
    if (saveError) { setError(saveError.message); return; }
    setShowcased((current) => show ? [...current, badgeId] : current.filter((id) => id !== badgeId));
    router.refresh();
  }

  return (
    <section className={styles.section} id="badges" aria-label="Badges">
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.grid}>
        {badges.map((badge) => {
          const isEarned = earned.has(badge.id);
          const isShown = showcased.includes(badge.id);
          const Icon = isEarned ? badgeIcon(badge.id) : Lock;
          return (
            <article className={`${styles.badge} ${isEarned ? styles.earned : ""}`} key={badge.id} aria-label={`${badge.name}${isEarned ? ", earned" : ", locked"}`}>
              <span className={styles.icon}><Icon size={18} /></span>
              <div>
                <strong>{badge.name}</strong>
                <small>{badge.description}</small>
                {isEarned && (
                  <button className={`${styles.showcase} ${isShown ? styles.showcaseOn : ""}`} type="button" onClick={() => toggleShowcase(badge.id)} disabled={saving === badge.id} aria-pressed={isShown}>
                    {isShown ? <Eye size={11} /> : <EyeOff size={11} />}
                    {isShown ? "On profile" : "Show on profile"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
