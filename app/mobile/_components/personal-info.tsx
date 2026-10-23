import { type LucideIcon } from "lucide-react";
import { PageHeading } from "@/app/mobile/_components/ui";
import styles from "./personal-info.module.css";

export type PersonalInfoField = { icon: LucideIcon; label: string; value: string | null };

export function PersonalInfo({ fields }: { fields: PersonalInfoField[] }) {
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
    </div>
  );
}
