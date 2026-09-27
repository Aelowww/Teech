import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen}><div className={styles.page}><EmptyState title="No appointment declined" description="Declining is available after appointment records are connected." /><ActionButtons actions={[{ label: "Back to Requests", href: "/faculty/requests" }]} primaryLabel="Back to Requests" /></div></MobileLayout>;
}
