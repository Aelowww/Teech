import { MobileLayout, PageHeading, ActionButtons, FormField } from "@/components/ui";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/teacher/sign-in">
      <div className={styles.page}>
        <PageHeading title="Forgot Password?" subtitle="Enter the email linked to your account and we&apos;ll send you a reset link." />
        <div className={styles.form}>
          <FormField label="Email" placeholder="Enter your school email" type="email" />
        </div>
        <ActionButtons actions={[{ label: "Send Reset Link", href: "/teacher/password-reset" }]} primaryLabel="Send Reset Link" />
      </div>
    </MobileLayout>
  );
}
