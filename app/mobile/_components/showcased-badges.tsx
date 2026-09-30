import Link from "next/link";
import type { CSSProperties } from "react";
import { badgeIcon } from "@/app/mobile/_components/badge-icons";
import styles from "./badge-grid.module.css";

// Soft pastel per badge: [background, icon]. Anything not listed uses lavender.
const badgeColors: Record<string, [string, string]> = {
  photo: ["#ffe3ee", "#d8508a"],
  "streak-7": ["#ffe9d6", "#e0782e"],
  "streak-30": ["#dff5ee", "#23946b"],
  "streak-100": ["#e9e4ff", "#6a55d8"],
  security: ["#e0f3e6", "#2f8f55"],
  "first-consultation": ["#fff4cf", "#c9921a"],
  regular: ["#e1efff", "#3b7bd4"],
  "open-door": ["#e6f6f3", "#26917f"],
  "quick-responder": ["#fff4cf", "#c9921a"],
  mentor: ["#f1e6ff", "#8a4fd0"],
  "shop-bookworm": ["#e1efff", "#3b7bd4"],
  "shop-night-owl": ["#e7e8fb", "#4d52b8"],
  "shop-legend": ["#fff1cc", "#c28a0e"],
};

// A scalloped rosette: 12 soft bumps around a circle, in a 40x40 box.
const rosette = (() => {
  const bumps = 12;
  const outer = 19.5;
  const inner = 17;
  const points: string[] = [];
  for (let index = 0; index < bumps; index++) {
    const start = (index / bumps) * Math.PI * 2;
    const middle = start + Math.PI / bumps;
    const end = start + (Math.PI * 2) / bumps;
    const at = (angle: number, radius: number) => `${(20 + radius * Math.cos(angle)).toFixed(2)} ${(20 + radius * Math.sin(angle)).toFixed(2)}`;
    if (index === 0) points.push(`M${at(start, inner)}`);
    points.push(`Q${at(middle, outer + 3)} ${at(end, inner)}`);
  }
  return `${points.join(" ")}Z`;
})();

// The badges a user chose to show, under their name on My Profile: little rosettes, no text.
// The name appears in a bubble on hover and is always there for screen readers.
export function ShowcasedBadges({ badges, href }: { badges: { id: string; name: string }[]; href: string }) {
  if (!badges.length) return null;
  return (
    <ul className={styles.showcased} aria-label="Showcased badges">
      {badges.map((badge, index) => {
        const Icon = badgeIcon(badge.id);
        const [tint, ink] = badgeColors[badge.id] || ["#efedfc", "#6a64c4"];
        return (
          <li key={badge.id} style={{ "--tint": tint, "--ink": ink, "--delay": `${index * 90}ms` } as CSSProperties}>
            <Link href={href} aria-label={badge.name} data-name={badge.name}>
              <svg className={styles.rosette} viewBox="0 0 40 40" aria-hidden="true"><path d={rosette} /></svg>
              <Icon className={styles.rosetteIcon} size={17} strokeWidth={2.3} aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
