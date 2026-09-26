import { MobileLayout, PageHeading, CardList, FilterTabs } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="notifications">
      <div className={styles.page}>
        <PageHeading title="Appointment Requests" />
        <FilterTabs filters={["All", "Confirmed", "Declined"]} selected={0} hrefs={["/student/appointment-requests", "/student/confirmed-requests", "/student/declined-requests"]} />
        <CardList items={[{ "title": "Appointment Confirmed", "description": "Dr. Adrian Villanueva · August 21, 2026 · 10:00 AM", "status": "Confirmed", "href": "/student/appointment-confirmed" }, { "title": "Appointment Confirmed", "description": "Prof. Camille Reyes · August 19, 2026 · 3:00 PM", "status": "Confirmed", "href": "/student/appointment-confirmed" }, { "title": "Appointment Declined", "description": "Dr. Julian De Leon · August 18, 2026 · 9:00 AM", "status": "Declined", "href": "/student/appointment-declined" }]} />
      </div>
    </MobileLayout>
  );
}

