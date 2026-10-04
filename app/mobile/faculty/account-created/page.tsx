import { MobileLayout, PageHeading, ActionButtons, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/faculty/create-account">
      <div className={styles.page}>
        <StatusIndicator status="success" />
        <PageHeading title="Account Created!" subtitle="Your email is verified. An admin is now reviewing your Faculty ID, and we will email you once you can sign in." />
        <ActionButtons actions={[{ label: "Go to Sign In", href: "/faculty/sign-in" }]} primaryLabel="Go to Sign In" />
      </div>
    </MobileLayout>
  );
}
