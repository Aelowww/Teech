import { MobileLayout, PageHeading, ActionButtons, DetailList, ConfirmationDialog } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/appointment-review">
      <div className={styles.page}>
        <PageHeading title="Review Appointment" />
        <DetailList details={[{ "label": "Student Name", "value": "Bea Camille Flores" }, { "label": "Student ID", "value": "2026 - 65379" }, { "label": "Faculty", "value": "Dr. Adrian Villanueva" }]} />
        <ConfirmationDialog title="Decline Appointment" danger>Decline the student’s appointment request for August 22, 2026 at 10:00 AM?</ConfirmationDialog>
        <ActionButtons actions={[{ "label": "Cancel", "href": "/teacher/appointment-review" }, { "label": "Decline Request", "href": "/teacher/appointment-declined", "tone": "danger" }]} primaryLabel="Decline Request" />
      </div>
    </MobileLayout>
  );
}

