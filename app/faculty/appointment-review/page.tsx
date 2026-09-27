import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen} backTo="/faculty/requests"><div className={styles.page}><EmptyState title="No appointment selected" description="Select a real appointment request to review it." /><ActionButtons actions={[{ label: "Back to Requests", href: "/faculty/requests" }]} primaryLabel="Back to Requests" /></div></MobileLayout>;
}
