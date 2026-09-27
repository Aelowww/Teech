import { MobileLayout, PageHeading, ActionButtons, Notice } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <div className={styles.page}>
        <PageHeading title="Password Recovery" subtitle="Student accounts use a Student ID instead of an email address." />
        <Notice>Ask your instructor or system administrator to reset your password.</Notice>
        <ActionButtons actions={[{ label: "Back to Sign In", href: "/student/sign-in" }]} primaryLabel="Back to Sign In" />
      </div>
    </MobileLayout>
  );
}
