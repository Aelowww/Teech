import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen} backTo="/teacher/requests"><div className={styles.page}><EmptyState title="No appointment selected" description="Select a real appointment request to review it." /><ActionButtons actions={[{ label: "Back to Requests", href: "/teacher/requests" }]} primaryLabel="Back to Requests" /></div></MobileLayout>;
}
