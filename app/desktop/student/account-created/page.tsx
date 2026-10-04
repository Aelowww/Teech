import { DesktopLayout, PageHeading, ActionButtons, StatusIndicator } from "@/app/desktop/_components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <DesktopLayout className={styles.screen} backTo="/student/create-account">
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Account Created!" subtitle="Check your inbox and confirm your email, then sign in. An admin will verify your Student ID before you can book consultations." />
        <ActionButtons actions={[{ "label": "Go to Sign In", "href": "/student/sign-in" }]} primaryLabel="Go to Sign In" />
      </div>
    </DesktopLayout>
  );
}
