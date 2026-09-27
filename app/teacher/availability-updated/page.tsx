import { MobileLayout, EmptyState, ActionButtons } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen}><div className={styles.page}><EmptyState title="No availability changes saved" description="Availability requires connected faculty scheduling records." /><ActionButtons actions={[{ label: "Back to Home", href: "/teacher/home" }]} primaryLabel="Back to Home" /></div></MobileLayout>;
}
