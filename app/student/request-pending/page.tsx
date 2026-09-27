import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <EmptyState title="No pending request" description="Your submitted requests are listed in Appointment Requests." />
        <ActionButtons actions={[{ label: "View Requests", href: "/student/appointment-requests" }, { label: "Back to Home", href: "/student/home" }]} primaryLabel="View Requests" />
      </div>
    </MobileLayout>
  );
}
