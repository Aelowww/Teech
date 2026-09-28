import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/create-account">
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Account Created!" subtitle="Your student account is ready. Sign in with your Student ID and password." />
        <ActionButtons actions={[{ "label": "Go to Sign In", "href": "/student/sign-in" }]} primaryLabel="Go to Sign In" />
      </div>
    </MobileLayout>
  );
}

