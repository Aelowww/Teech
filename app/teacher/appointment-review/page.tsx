import { MobileLayout, PageHeading, ActionButtons, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/notifications">
      <div className={styles.page}>
        <PageHeading title="Review Appointment" subtitle="Review the student’s consultation request." />
        <DetailList details={[{ "label": "Student Name", "value": "Bea Camille Flores" }, { "label": "Student ID", "value": "2026 - 65379" }, { "label": "Faculty", "value": "Dr. Adrian Villanueva" }, { "label": "Date", "value": "August 22, 2026" }, { "label": "Time", "value": "10:00 AM" }, { "label": "Reason", "value": "Need help with my final project." }]} />
        <ActionButtons actions={[{ "label": "Decline", "href": "/teacher/decline-appointment", "tone": "danger" }, { "label": "Approve", "href": "/teacher/confirm-approval" }]} primaryLabel="Approve" />
      </div>
    </MobileLayout>
  );
}

