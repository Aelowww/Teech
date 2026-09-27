import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <div className={styles.page}>
        <EmptyState title="No faculty profile selected" description="Faculty details will appear after faculty records are available." />
        <ActionButtons actions={[{ label: "Back to Faculty", href: "/student/faculty" }]} primaryLabel="Back to Faculty" />
      </div>
    </MobileLayout>
  );
}
