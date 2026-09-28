import { MobileLayout, PageHeading, ActionButtons, Notice, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Check your email" subtitle="If an account exists for that email, a password reset link is on its way." />
        <Notice>Check your inbox and follow the secure link to choose a new password.</Notice>
        <ActionButtons actions={[{ label: "Back to Sign In", href: "/faculty/sign-in" }]} primaryLabel="Back to Sign In" />
      </div>
    </MobileLayout>
  );
}
