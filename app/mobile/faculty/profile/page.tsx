import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, ChevronRight, FileText, KeyRound, ShieldCheck, ShieldQuestion, UserRound } from "lucide-react";
import { MobileLayout, PageHeading, ProfilePhoto } from "@/app/mobile/_components/ui";
import { avatarUrl } from "@/lib/avatar";
import { ShowcasedBadges } from "@/app/mobile/_components/showcased-badges";
import { SignOutButton } from "@/app/mobile/_components/sign-out-button";
import { DeleteAccountButton } from "@/app/mobile/_components/delete-account-button";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/faculty/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/faculty/sign-in");

  const { data: showcase } = await supabase
    .from("user_badges")
    .select("badge_id, badges(name, sort_order)")
    .eq("showcased", true);
  const showcasedBadges = ((showcase || []) as unknown as { badge_id: string; badges: { name: string; sort_order: number } | null }[])
    .filter((row) => row.badges)
    .sort((first, second) => (first.badges?.sort_order || 0) - (second.badges?.sort_order || 0))
    .map((row) => ({ id: row.badge_id, name: row.badges?.name || "" }));

  return (
    <MobileLayout className={styles.screen} role="faculty" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="My Profile" />
        <div className={styles.identity}>
          <ProfilePhoto src={avatarUrl(profile.avatar_path)} />
          <strong>{profile.full_name}</strong>
          <ShowcasedBadges badges={showcasedBadges} />
        </div>
        <section className={styles.actionList} aria-label="Profile settings">
          <Link className={styles.settingLink} href="/faculty/profile/info"><span><UserRound size={15} />Personal Information</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/badges"><span><Award size={15} />Badges</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/password"><span><KeyRound size={15} />Change Password</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/security"><span><ShieldQuestion size={15} />Account Recovery</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/privacy"><span><ShieldCheck size={15} />Privacy Policy</span><ChevronRight size={16} /></Link>
          <Link className={styles.settingLink} href="/faculty/profile/terms"><span><FileText size={15} />Terms of Service</span><ChevronRight size={16} /></Link>
          <DeleteAccountButton role="faculty" className={styles.settingLink} />
        </section>
        <div className={styles.signOut}><SignOutButton redirectTo="/welcome" /></div>
      </div>
    </MobileLayout>
  );
}
