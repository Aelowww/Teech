import { MobileLayout, PageHeading, ActionButtons, Notice, StatusIndicator, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="pending" />
        <PageHeading title="Request Pending" subtitle="Waiting for the faculty to confirm your appointment." />
        <Notice>Please arrive on time. You may show your appointment ID for verification.</Notice>
        <DetailList details={[{ "label": "Student Name", "value": "Bea Camille Flores" }, { "label": "Student ID", "value": "2026 - 65379" }, { "label": "Faculty", "value": "Dr. Adrian Villanueva" }, { "label": "Date", "value": "August 22, 2026" }, { "label": "Time", "value": "10:00 AM" }]} />
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/student/home" }, { "label": "View Status", "href": "/student/waiting-confirmation" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

