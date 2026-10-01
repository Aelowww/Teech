import { redirect } from "next/navigation";
import { DesktopLayout } from "@/app/desktop/_components/ui";
import { ProfileOverview } from "@/app/desktop/_components/profile-overview";
import { signedAvatarUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/faculty/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_path, email, faculty_number, department")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/faculty/sign-in");
  const photoUrl = await signedAvatarUrl(supabase, profile.avatar_path);

  const { data: showcase } = await supabase
    .from("user_badges")
    .select("badge_id, badges(name, sort_order)")
    .eq("showcased", true);
  const showcasedBadges = ((showcase || []) as unknown as { badge_id: string; badges: { name: string; sort_order: number } | null }[])
    .filter((row) => row.badges)
    .sort((first, second) => (first.badges?.sort_order || 0) - (second.badges?.sort_order || 0))
    .map((row) => ({ id: row.badge_id, name: row.badges?.name || "" }));

  const details = [
    { label: "Full name", value: profile.full_name },
    { label: "Faculty ID", value: profile.faculty_number },
    { label: "Department", value: profile.department },
    { label: "Email", value: profile.email },
  ];
  const chips = [profile.department, profile.faculty_number ? `ID ${profile.faculty_number}` : null].filter((chip): chip is string => Boolean(chip));

  return (
    <DesktopLayout className={styles.screen} role="faculty" activeNav="profile">
      <ProfileOverview role="faculty" name={profile.full_name} avatarPath={profile.avatar_path} photoUrl={photoUrl} badges={showcasedBadges} details={details} chips={chips} />
    </DesktopLayout>
  );
}
