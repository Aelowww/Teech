import { MobileLayout, PageHeading, ActionButtons, MonthCalendar } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="teacher" activeNav="calendar">
      <div className={styles.page}>
        <PageHeading title="August 2026" subtitle="Your consultation schedule at a glance." />
        <MonthCalendar />
        <ActionButtons actions={[{ "label": "Manage Availability", "href": "/teacher/availability" }]} primaryLabel="Manage Availability" />
      </div>
    </MobileLayout>
  );
}

