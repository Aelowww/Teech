import Link from "next/link";
import { MobileLayout, PageHeading, ActionButtons, FormField } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <div className={styles.page}>
        <PageHeading title="Create Account" subtitle="Fill in your information to get started." />
        <div className={styles.form}>
          <FormField label="Full Name" placeholder="Enter your full name" />
          <FormField label="Email" placeholder="you@school.edu" type="email" />
          <FormField label="Password" placeholder="Create a password" type="password" />
          <FormField label="Confirm Password" placeholder="Re-enter your password" type="password" />
          <label className={styles.checkbox}>
            <input type="checkbox" defaultChecked />
            <span>I agree to the Terms and Privacy Policy</span>
          </label>
        </div>
        <p className={styles.formNote}>Already have an account? <Link href="/student/sign-in">Sign In</Link>
        </p>
        <ActionButtons actions={[{ "label": "Create Account", "href": "/student/account-created" }]} primaryLabel="Create Account" />
      </div>
    </MobileLayout>
  );
}

