import Link from "next/link";
import { MobileLayout, PageHeading, ActionButtons, FormField } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/welcome">
      <div className={styles.page}>
        <PageHeading title="Sign In" subtitle="Welcome back! Please enter your credentials." />
        <div className={styles.form}>
          <FormField label="Faculty ID" placeholder="WIT-2026-1234" />
          <FormField label="Password" placeholder="Enter your password" type="password" />
          <Link className={styles.inlineLink} href="/student/forgot-password">Forgot Password?</Link>
        </div>
        <p className={styles.formNote}>Don’t have an account? <Link href="/teacher/create-account">Sign Up</Link>
        </p>
        <ActionButtons actions={[{ "label": "Sign In", "href": "/teacher/home" }]} primaryLabel="Sign In" />
      </div>
    </MobileLayout>
  );
}

