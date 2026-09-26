import { MobileLayout, PageHeading, ActionButtons, MonthCalendar } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty-profile" role="student" activeNav="calendar">
      <div className={styles.page}>
        <PageHeading title="August 2026" subtitle="Choose a day to see faculty availability." />
        <MonthCalendar />
        <ActionButtons actions={[{ "label": "Continue", "href": "/student/select-date-time" }]} primaryLabel="Continue" />
      </div>
    </MobileLayout>
  );
}

