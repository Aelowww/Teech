import { MobileLayout, PageHeading, ActionButtons, StatusIndicator, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="declined" />
        <PageHeading title="Appointment Declined." subtitle="Your appointment request was declined. You can book another time with the same faculty member." />
        <DetailList details={[{ "label": "Student Name", "value": "Bea Camille Flores" }, { "label": "Reason", "value": "Need help with my final project." }, { "label": "Date", "value": "August 22, 2026" }, { "label": "Time", "value": "10:00 AM" }, { "label": "Appointment ID", "value": "APPT-2026-0822" }, { "label": "Status", "value": "Declined" }]} />
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/student/home" }, { "label": "Choose Another Time", "href": "/student/calendar" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

