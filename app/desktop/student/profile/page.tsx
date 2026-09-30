import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, ChevronRight, FileText, KeyRound, ShieldCheck, ShieldQuestion, UserRound } from "lucide-react";
import { DesktopLayout, PageHeading, ProfilePhoto } from "@/app/desktop/_components/ui";
import { signedAvatarUrl } from "@/lib/avatar";
import { ShowcasedBadges } from "@/app/desktop/_components/showcased-badges";
import { SignOutButton } from "@/app/desktop/_components/sign-out-button";
import { DeleteAccountButton } from "@/app/desktop/_components/delete-account-button";
import { SupportChat } from "@/app/desktop/_components/support-chat";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/student/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "student") redirect("/student/sign-in");
  const photoUrl = await signedAvatarUrl(supabase, profile.avatar_path);

  const { data: showcase } = await supabase
    .from("user_badges")
    .select("badge_id, badges(name, sort_order)")
    .eq("showcased", true);
  const showcasedBadges = ((showcase || []) as unknown as { badge_id: string; badges: { name: string; sort_order: number } | null }[])
    .filter((row) => row.badges)
    .sort((first, second) => (first.badges?.sort_order || 0) - (second.badges?.sort_order || 0))
    .map((row) => ({ id: row.badge_id, name: row.badges?.name || "" }));

  return (
    <DesktopLayout className={styles.screen} role="student" activeNav="profile">
      <PageHeading title="Profile & Settings" subtitle="Manage your account, security, and preferences." />
      <div className={styles.page}>
        <aside className={styles.identity}>
          <ProfilePhoto src={photoUrl} />
          <strong>{profile.full_name}</strong>
          <small>Student</small>
          <ShowcasedBadges badges={showcasedBadges} />
          <Link className={styles.editProfile} href="/student/profile/info">View personal information</Link>
          <div className={styles.signOut}><SignOutButton redirectTo="/welcome" /></div>
        </aside>

        <div className={styles.settings}>
          <section className={styles.group} aria-labelledby="account-settings">
            <h2 id="account-settings">Account</h2>
            <div className={styles.actionList}>
              <Link className={styles.settingLink} href="/student/profile/info"><span><UserRound size={18} />Personal Information</span><ChevronRight size={18} /></Link>
              <Link className={styles.settingLink} href="/student/profile/badges"><span><Award size={18} />Badges</span><ChevronRight size={18} /></Link>
            </div>
          </section>

          <section className={styles.group} aria-labelledby="security-settings">
            <h2 id="security-settings">Security</h2>
            <div className={styles.actionList}>
              <Link className={styles.settingLink} href="/student/profile/password"><span><KeyRound size={18} />Change Password</span><ChevronRight size={18} /></Link>
              <Link className={styles.settingLink} href="/student/profile/security"><span><ShieldQuestion size={18} />Account Recovery</span><ChevronRight size={18} /></Link>
            </div>
          </section>

          <section className={styles.group} aria-labelledby="support-settings">
            <h2 id="support-settings">Support &amp; Legal</h2>
            <div className={styles.actionList}>
              <SupportChat audience="student" variant="row" className={styles.settingLink} />
              <Link className={styles.settingLink} href="/student/profile/privacy"><span><ShieldCheck size={18} />Privacy Policy</span><ChevronRight size={18} /></Link>
              <Link className={styles.settingLink} href="/student/profile/terms"><span><FileText size={18} />Terms of Service</span><ChevronRight size={18} /></Link>
            </div>
          </section>

          <section className={`${styles.group} ${styles.danger}`} aria-labelledby="danger-settings">
            <h2 id="danger-settings">Danger Zone</h2>
            <div className={styles.actionList}>
              <DeleteAccountButton role="student" className={styles.settingLink} />
            </div>
          </section>
        </div>
      </div>
    </DesktopLayout>
  );
}
