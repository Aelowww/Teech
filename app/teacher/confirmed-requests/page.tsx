import { MobileLayout, PageHeading, EmptyState } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return <MobileLayout className={styles.screen} backTo="/teacher/requests" role="teacher" activeNav="requests"><div className={styles.page}><PageHeading title="Confirmed Requests" /><EmptyState title="No confirmed requests" description="Confirmed appointment records will appear here when they are available." /></div></MobileLayout>;
}
