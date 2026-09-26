import { MobileLayout, PageHeading, ActionButtons, ConfirmationDialog } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/availability">
      <div className={styles.page}>
        <PageHeading title="Manage Availability" />
        <ConfirmationDialog title="Availability Update">Are you sure in updating your schedule?</ConfirmationDialog>
        <ActionButtons actions={[{ "label": "Cancel", "href": "/teacher/availability" }, { "label": "Yes, proceed", "href": "/teacher/availability-updated" }]} primaryLabel="Yes, proceed" />
      </div>
    </MobileLayout>
  );
}

