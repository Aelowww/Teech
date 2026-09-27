import { MobileLayout, PageHeading, EmptyState } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/appointment-requests" role="student" activeNav="requests">
      <div className={styles.page}>
        <PageHeading title="Confirmed Requests" />
        <EmptyState title="No confirmed requests" description="Confirmed appointments will appear here when they are available." />
      </div>
    </MobileLayout>
  );
}
