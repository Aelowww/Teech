import { badgeIcon } from "@/app/mobile/_components/badge-icons";
import styles from "./badge-grid.module.css";

export function ShowcasedBadges({ badges }: { badges: { id: string; name: string }[] }) {
  if (!badges.length) return null;
  return (
    <ul className={styles.chips} aria-label="Showcased badges">
      {badges.map((badge) => {
        const Icon = badgeIcon(badge.id);
        return <li key={badge.id}><Icon size={12} />{badge.name}</li>;
      })}
    </ul>
  );
}
