import { MobileLayout, PageHeading, EmptyState } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <div className={styles.page}>
        <PageHeading title="Available Faculty" />
        <EmptyState title="No faculty records" description="Available faculty will appear here when records are added." />
      </div>
    </MobileLayout>
  );
}
