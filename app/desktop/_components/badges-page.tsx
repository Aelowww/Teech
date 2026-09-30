import { redirect } from "next/navigation";
import { DesktopLayout, PageHeading } from "@/app/desktop/_components/ui";
import { BadgeGrid } from "@/app/desktop/_components/badge-grid";
import { createClient } from "@/lib/supabase/server";
import styles from "./profile-settings.module.css";

export async function BadgesPage({ role }: { role: "student" | "faculty" }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${role}/sign-in`);

  const [{ data: badges }, { data: earnedBadges }] = await Promise.all([
    supabase.from("badges").select("id, name, description").in("role", ["all", role]).order("sort_order"),
    supabase.from("user_badges").select("badge_id, showcased"),
  ]);
  const earnedIds = (earnedBadges || []).map((row) => row.badge_id as string);
  const showcasedIds = (earnedBadges || []).filter((row) => row.showcased).map((row) => row.badge_id as string);
  const earnedCount = (badges || []).filter((badge) => earnedIds.includes(badge.id)).length;

  return (
    <DesktopLayout className={styles.screen} backTo={`/${role}/profile`} role={role} activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="Badges" subtitle={badges?.length ? `${earnedCount} of ${badges.length} earned. Choose up to 3 to show on your profile.` : "Badges are not available yet."} />
        {badges && badges.length > 0 && <BadgeGrid badges={badges} earnedIds={earnedIds} showcasedIds={showcasedIds} />}
      </div>
    </DesktopLayout>
  );
}
