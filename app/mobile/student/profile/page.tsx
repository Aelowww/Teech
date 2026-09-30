import { redirect } from "next/navigation";
import { MobileLayout } from "@/app/mobile/_components/ui";
import { ProfileOverview } from "@/app/mobile/_components/profile-overview";
import { signedAvatarUrl } from "@/lib/avatar";
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
    <MobileLayout className={styles.screen} role="student" activeNav="profile">
      <ProfileOverview role="student" name={profile.full_name} avatarPath={profile.avatar_path} photoUrl={photoUrl} badges={showcasedBadges} />
    </MobileLayout>
  );
}
