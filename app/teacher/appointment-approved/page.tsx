import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen}><div className={styles.page}><EmptyState title="No appointment approved" description="Approval is available after appointment records are connected." /><ActionButtons actions={[{ label: "Back to Requests", href: "/teacher/requests" }]} primaryLabel="Back to Requests" /></div></MobileLayout>;
}
