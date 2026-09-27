import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <EmptyState title="No declined appointment" description="Declined appointment details will appear here when they are available." />
        <ActionButtons actions={[{ label: "Back to Home", href: "/student/home" }, { label: "Book a Consultation", href: "/student/calendar" }]} primaryLabel="Book a Consultation" />
      </div>
    </MobileLayout>
  );
}
