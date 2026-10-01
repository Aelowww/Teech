import Link from "next/link";
<<<<<<< HEAD
import type { CSSProperties } from "react";
import { badgeIcon } from "@/app/mobile/_components/badge-icons";
import styles from "./badge-grid.module.css";

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

=======
import { BadgeMedal } from "@/app/mobile/_components/badge-medal";
import styles from "./showcased-badges.module.css";

>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
export function ShowcasedBadges({ badges, href }: { badges: { id: string; name: string }[]; href: string }) {
  if (!badges.length) return null;
  return (
    <ul className={styles.showcased} aria-label="Showcased badges">
<<<<<<< HEAD
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
=======
      {badges.map((badge, index) => (
        <li key={badge.id}>
          <Link className={styles.badge} href={href} aria-label={badge.name} data-name={badge.name}>
            <BadgeMedal id={badge.id} size={37} glitter delay={index * 110} />
          </Link>
        </li>
      ))}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    </ul>
  );
}
