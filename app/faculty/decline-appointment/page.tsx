import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen} backTo="/faculty/appointment-review"><div className={styles.page}><EmptyState title="No appointment selected" description="An appointment must be selected before it can be declined." /><ActionButtons actions={[{ label: "Back to Requests", href: "/faculty/requests" }]} primaryLabel="Back to Requests" /></div></MobileLayout>;
}
