import { MobileLayout, PageHeading, ActionButtons, StatusIndicator, DetailList } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Availability Updated!" subtitle="Your schedule has been saved. Students can now book your open slots." />
        <DetailList details={[{ "label": "August 21, 2026", "value": "4:00 – 4:30 PM · Available" }]} />
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/teacher/home" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

