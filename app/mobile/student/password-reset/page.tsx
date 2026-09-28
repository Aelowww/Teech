import { MobileLayout, PageHeading, ActionButtons, Notice, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Password updated" subtitle="You can now sign in with your new password." />
        <Notice>For your security, you&apos;ve been signed out on all devices.</Notice>
        <ActionButtons actions={[{ label: "Back to Sign In", href: "/student/sign-in" }]} primaryLabel="Back to Sign In" />
      </div>
    </MobileLayout>
  );
}
