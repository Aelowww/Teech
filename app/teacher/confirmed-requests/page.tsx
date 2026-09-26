import { MobileLayout, PageHeading, CardList, FilterTabs } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/notifications" role="teacher" activeNav="notifications">
      <div className={styles.page}>
        <PageHeading title="Notifications" />
        <FilterTabs filters={["All", "Confirmed", "Declined"]} selected={1} />
        <CardList items={[{ "title": "Appointment Confirmed", "description": "Dr. Adrian Villanueva · August 21, 2026 · 10:00 AM", "status": "Confirmed", "href": "/student/appointment-confirmed" }, { "title": "Appointment Confirmed", "description": "Prof. Camille Reyes · August 19, 2026 · 3:00 PM", "status": "Confirmed", "href": "/student/appointment-confirmed" }]} />
      </div>
    </MobileLayout>
  );
}

