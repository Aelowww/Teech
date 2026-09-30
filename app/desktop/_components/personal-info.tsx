import Link from "next/link";
import { Pencil, type LucideIcon } from "lucide-react";
import { PageHeading } from "@/app/desktop/_components/ui";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import styles from "./personal-info.module.css";

export type PersonalInfoField = { icon: LucideIcon; label: string; value: string | null };

export function PersonalInfo({ fields, editHref }: { fields: PersonalInfoField[]; editHref: string }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}><PageHeading title="Personal Information" subtitle="The details shown in your portal." /></div>
        <Link className={`${buttonStyles.button} ${buttonStyles.secondary} ${styles.edit}`} href={editHref}>
          <Pencil size={15} aria-hidden="true" />Edit details
        </Link>
      </header>
      <dl className={styles.list}>
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.row}>
            <Icon className={styles.icon} size={18} aria-hidden="true" />
            <dt>{label}</dt>
            <dd className={value ? "" : styles.empty}>{value || "Not set"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
