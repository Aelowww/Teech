import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/create-account">
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Account Created!" subtitle="Your email is verified. Sign in with your Student ID. You can book consultations once an admin verifies your ID." />
        <ActionButtons actions={[{ "label": "Go to Sign In", "href": "/student/sign-in" }]} primaryLabel="Go to Sign In" />
      </div>
    </MobileLayout>
  );
}
