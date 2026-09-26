import { MobileLayout, PageHeading, ActionButtons, AvailabilitySlots } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/calendar">
      <div className={styles.page}>
        <PageHeading title="Book a consultation" subtitle="Dr. Adrian Villanueva · ITPE 4" />
        <AvailabilitySlots times={["9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"]} />
        <ActionButtons actions={[{ "label": "Continue", "href": "/student/appointment-info" }]} primaryLabel="Continue" />
      </div>
    </MobileLayout>
  );
}

