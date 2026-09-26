import { MobileLayout, PageHeading, CardList, FilterTabs } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/notifications" role="teacher" activeNav="notifications">
      <div className={styles.page}>
        <PageHeading title="Notifications" />
        <FilterTabs filters={["All", "Confirmed", "Declined"]} selected={2} />
        <CardList items={[{ "title": "Appointment Declined", "description": "Dr. Julian De Leon · August 18, 2026 · 9:00 AM", "status": "Declined", "href": "/student/appointment-declined" }]} />
      </div>
    </MobileLayout>
  );
}

