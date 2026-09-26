import Link from "next/link";
import { MobileLayout, PageHeading, ActionButtons, FormField, Notice } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <div className={styles.page}>
        <PageHeading title="Sign In" />
        <div className={styles.form}>
          <FormField label="Student ID" placeholder="65379" />
          <FormField label="Password" placeholder="••••••••" type="password" />
          <Link className={styles.inlineLink} href="/student/forgot-password">Forgot Password?</Link>
        </div>
        <Notice>Invalid ID number or password. Please try again.</Notice>
        <ActionButtons actions={[{ "label": "Try Again", "href": "/student/home" }]} primaryLabel="Try Again" />
      </div>
    </MobileLayout>
  );
}

