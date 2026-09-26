import { MobileLayout, PageHeading, ActionButtons, StatusIndicator, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="pending" />
        <PageHeading title="Waiting for confirmation" subtitle="We’ll notify you once your appointment has been confirmed." />
        <DetailList details={[{ "label": "Appointment ID", "value": "APPT-2026-0822" }, { "label": "Faculty", "value": "Dr. Adrian Villanueva" }, { "label": "Date", "value": "August 22, 2026" }, { "label": "Time", "value": "10:00 AM" }, { "label": "Status", "value": "Pending" }]} />
        <div className={styles.info}>
          <span>Sent</span>
          <span>Pending</span>
          <span>Confirmed</span>
        </div>
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/student/home" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

