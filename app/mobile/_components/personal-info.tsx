import Link from "next/link";
import { Pencil, type LucideIcon } from "lucide-react";
import { PageHeading } from "@/app/mobile/_components/ui";
import { TextBone } from "@/app/mobile/_components/skeleton";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import styles from "./personal-info.module.css";

export type PersonalInfoField = { icon: LucideIcon; label: string; value: string | null };

export function PersonalInfoSkeleton({ fields, editHref }: { fields: Omit<PersonalInfoField, "value">[]; editHref: string }) {
  return (
    <div className={styles.page}>
      <PageHeading title="Personal Information" subtitle="The details shown in your portal." />
      <dl className={styles.list}>
        {fields.map(({ icon: Icon, label }, index) => (
          <div key={label} className={styles.row}>
            <Icon className={styles.icon} size={16} aria-hidden="true" />
            <dt>{label}</dt>
            <dd><TextBone size={15} width={["62%", "38%", "50%", "70%"][index % 4]} /></dd>
          </div>
        ))}
      </dl>
      <Link className={`${buttonStyles.button} ${buttonStyles.secondary} ${styles.edit}`} href={editHref}>
        <Pencil size={15} aria-hidden="true" />Edit details
      </Link>
    </div>
  );
}

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
