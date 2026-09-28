"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import { SignOutEverywhere } from "@/app/mobile/_components/sign-out-everywhere";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/mobile/_components/profile-settings.module.css";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadEmail() {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      if (!active) return;
      setEmail(user.email || "");
      setIsLoading(false);
    }
    void loadEmail();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/profile" role="faculty" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="Account Recovery" subtitle="How you get back into your account if you forget your password." />
        <section className={styles.securityCard}>
          <h2><Mail size={15} />Recovery email</h2>
          <strong className={styles.securityValue}>{email}</strong>
          <p>If you forget your password, tap <b>Forgot Password</b> on the sign-in screen and we&apos;ll email a reset link to this address.</p>
          <Link className={styles.textAction} href="/faculty/profile/edit">Change email</Link>
        </section>
        <SignOutEverywhere role="faculty" />
      </div>
    </MobileLayout>
  );
}
