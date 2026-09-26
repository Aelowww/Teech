import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Request Submitted!" subtitle="Your request has been successfully submitted. We’ll notify you once it’s confirmed." />
        <ActionButtons actions={[{ "label": "Back to Home", "href": "/student/home" }, { "label": "Track Request", "href": "/student/request-pending" }]} primaryLabel="Back to Home" />
      </div>
    </MobileLayout>
  );
}

