import { ActionButtons, MobileLayout, PageHeading, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="student" activeNav="requests">
      <div className={styles.page}>
        <StatusIndicator status="pending" />
        <PageHeading title="Request Submitted" subtitle="Your consultation request has been sent to the faculty member." />
        <p className={styles.message}>You can track the request status from your requests page.</p>
        <ActionButtons
          actions={[
            { label: "View My Requests", href: "/student/appointment-requests" },
            { label: "Back to Home", href: "/student/home" },
          ]}
          primaryLabel="View My Requests"
        />
      </div>
    </MobileLayout>
  );
}
