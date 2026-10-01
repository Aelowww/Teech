import Link from "next/link";
import { BadgeMedal } from "@/app/mobile/_components/badge-medal";
import styles from "./showcased-badges.module.css";

export function ShowcasedBadges({ badges, href }: { badges: { id: string; name: string }[]; href: string }) {
  if (!badges.length) return null;
  return (
    <ul className={styles.showcased} aria-label="Showcased badges">
      {badges.map((badge, index) => (
        <li key={badge.id}>
          <Link className={styles.badge} href={href} aria-label={badge.name} data-name={badge.name}>
            <BadgeMedal id={badge.id} size={37} glitter delay={index * 110} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
