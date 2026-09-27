import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CircleHelp, FileText, KeyRound, Pencil, ShieldCheck } from "lucide-react";
import { MobileLayout, PageHeading, ProfilePhoto } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/faculty/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, faculty_number, department, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/faculty/sign-in");

  return (
    <MobileLayout className={styles.screen} role="faculty" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="My Profile" />
        <div className={styles.identity}>
          <ProfilePhoto />
          <strong>{profile.full_name}</strong>
        </div>
        <section className={styles.informationCard}>
          <div className={styles.informationHeader}>
            <h2>Personal Information</h2>
            <Link className={styles.editLink} href="/faculty/profile/edit"><Pencil size={14} />Edit</Link>
          </div>
          <dl className={styles.details}>
            <div><dt>Faculty ID</dt><dd>{profile.faculty_number}</dd></div>
            <div><dt>Department</dt><dd>{profile.department}</dd></div>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
          </dl>
        </section>
        <section className={styles.actionList} aria-label="Profile settings">
          <Link className={styles.settingLink} href="/faculty/profile/password"><span><KeyRound size={15} />Change Password</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/privacy"><span><ShieldCheck size={15} />Privacy Policy</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/terms"><span><FileText size={15} />Terms of Service</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/help"><span><CircleHelp size={15} />Help &amp; Support</span><ChevronRight size={16} /></Link>
        </section>
        <div className={styles.signOut}><SignOutButton redirectTo="/splash" /></div>
      </div>
    </MobileLayout>
  );
}
