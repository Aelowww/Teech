import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Appointment Approved" subtitle="The student has been notified and the appointment has been added to your schedule." />
        <ActionButtons actions={[{ "label": "View Schedule", "href": "/teacher/calendar" }, { "label": "Back to Requests", "href": "/teacher/notifications" }]} primaryLabel="View Schedule" />
      </div>
    </MobileLayout>
  );
}

