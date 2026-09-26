import { MobileLayout, PageHeading, ActionButtons, Notice, StatusIndicator, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Appointment Confirmed!" subtitle="Your appointment has been confirmed. See you there!" />
        <Notice>Please arrive on time. You may show your appointment ID for verification.</Notice>
        <DetailList details={[{ "label": "Student Name", "value": "Bea Camille Flores" }, { "label": "Reason", "value": "Need help with my final project." }, { "label": "Date", "value": "August 22, 2026" }, { "label": "Time", "value": "10:00 AM" }, { "label": "Appointment ID", "value": "APPT-2026-0822" }, { "label": "Status", "value": "Confirmed" }]} />
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/student/home" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

