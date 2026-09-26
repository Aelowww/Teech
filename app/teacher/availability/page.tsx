import { MobileLayout, PageHeading, ActionButtons, AvailabilitySlots } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/calendar">
      <div className={styles.page}>
        <PageHeading title="Manage Availability" subtitle="Choose your available consultation slots." />
        <AvailabilitySlots times={["9:00 – 9:20 AM", "10:00 – 10:30 AM", "11:00 – 11:30 AM", "2:00 – 2:30 PM", "4:00 – 4:30 PM"]} />
        <ActionButtons actions={[{ "label": "Add Time Slot", "href": "/teacher/availability" }, { "label": "Save Availability", "href": "/teacher/availability-updated" }]} primaryLabel="Save Availability" />
      </div>
    </MobileLayout>
  );
}

