"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { badgeIcon } from "@/app/desktop/_components/badge-icons";
import { badgeColors } from "@/app/desktop/_components/showcased-badges";
import { createClient } from "@/lib/supabase/client";
import styles from "./badge-grid.module.css";

export type Badge = { id: string; name: string; description: string };

const maxShowcased = 3;

export function BadgeGrid({ badges, earnedIds, showcasedIds }: { badges: Badge[]; earnedIds: string[]; showcasedIds: string[] }) {
  const router = useRouter();
  const earned = new Set(earnedIds);
  const [showcased, setShowcased] = useState(showcasedIds);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  const earnedBadges = badges.filter((badge) => earned.has(badge.id));
  const lockedBadges = badges.filter((badge) => !earned.has(badge.id));
  const full = showcased.length >= maxShowcased;

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

      {earnedBadges.length > 0 && (
        <div className={styles.group}>
          <h2>Earned <span>{earnedBadges.length}</span></h2>
          <ul className={styles.list}>
            {earnedBadges.map((badge) => {
              const Icon = badgeIcon(badge.id);
              const isShown = showcased.includes(badge.id);
              const [tint, ink] = badgeColors[badge.id] || ["#efedfc", "#6a64c4"];
              return (
                <li key={badge.id} className={`${styles.tile} ${isShown ? styles.tileShown : ""}`} style={{ "--badge-tint": tint, "--badge-ink": ink } as CSSProperties}>
                  <span className={styles.icon}><Icon size={24} aria-hidden="true" /></span>
                  <span className={styles.text}>
                    <strong>{badge.name}</strong>
                    <small>{badge.description}</small>
                  </span>
                  <button
                    className={`${styles.showcase} ${isShown ? styles.showcaseOn : ""}`}
                    type="button"
                    onClick={() => toggleShowcase(badge.id)}
                    disabled={saving === badge.id || (!isShown && full)}
                    aria-pressed={isShown}
                    aria-label={isShown ? `Hide ${badge.name} from profile` : `Show ${badge.name} on profile`}
                    title={!isShown && full ? `You can show up to ${maxShowcased} badges` : undefined}
                  >
                    {isShown && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                    {isShown ? "Shown on profile" : "Show on profile"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {lockedBadges.length > 0 && (
        <div className={styles.group}>
          <h2>Locked <span>{lockedBadges.length}</span></h2>
          <ul className={styles.list}>
            {lockedBadges.map((badge) => {
              const Icon = badgeIcon(badge.id);
              return (
                <li key={badge.id} className={`${styles.tile} ${styles.locked}`} aria-label={`${badge.name}, locked. ${badge.description}`}>
                  <span className={styles.icon}><Icon size={24} aria-hidden="true" /></span>
                  <span className={styles.text}>
                    <strong>{badge.name}</strong>
                    <small>{badge.description}</small>
                  </span>
                  <span className={styles.lockTag}><Lock size={12} aria-hidden="true" />Locked</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
