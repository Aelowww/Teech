import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="declined" />
        <PageHeading title="Appointment Declined" subtitle="The student has been notified and may select another available schedule." />
        <ActionButtons actions={[{ "label": "View Schedule", "href": "/teacher/calendar" }, { "label": "Back to Requests", "href": "/teacher/notifications" }]} primaryLabel="View Schedule" />
      </div>
    </MobileLayout>
  );
}

