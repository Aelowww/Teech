import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <EmptyState title="No confirmed appointment" description="Confirmed appointments will appear here when they are available." />
        <ActionButtons actions={[{ label: "Back to Home", href: "/student/home" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}
