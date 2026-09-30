import { DesktopLayout, PageHeading, ActionButtons, StatusIndicator } from "@/app/desktop/_components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <DesktopLayout className={styles.screen} backTo="/faculty/create-account">
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Account Created!" subtitle="Your faculty account has been successfully created." />
        <ActionButtons actions={[{ label: "Go to Sign In", href: "/faculty/sign-in" }]} primaryLabel="Go to Sign In" />
      </div>
    </DesktopLayout>
  );
}
