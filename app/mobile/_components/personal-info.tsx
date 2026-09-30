import Link from "next/link";
import { Pencil, type LucideIcon } from "lucide-react";
import { PageHeading } from "@/app/mobile/_components/ui";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./personal-info.module.css";

export type PersonalInfoField = { icon: LucideIcon; label: string; value: string | null };

// Personal Information screen body, shared by students and faculty: one row per detail, then an Edit button.
export function PersonalInfo({ fields, editHref }: { fields: PersonalInfoField[]; editHref: string }) {
  return (
    <div className={styles.page}>
      <PageHeading title="Personal Information" subtitle="The details shown in your portal." />
      <dl className={styles.list}>
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.row}>
            <Icon className={styles.icon} size={16} aria-hidden="true" />
            <dt>{label}</dt>
            <dd className={value ? "" : styles.empty}>{value || "Not set"}</dd>
          </div>
        ))}
      </dl>
      <Link className={`${buttonStyles.button} ${buttonStyles.secondary} ${styles.edit}`} href={editHref}>
        <Pencil size={15} aria-hidden="true" />Edit details
      </Link>
    </div>
  );
}
