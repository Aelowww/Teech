import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <EmptyState title="No request awaiting confirmation" description="Submitted requests will appear in Appointment Requests." />
        <ActionButtons actions={[{ label: "View Requests", href: "/student/appointment-requests" }]} primaryLabel="View Requests" />
      </div>
    </MobileLayout>
  );
}
