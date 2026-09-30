import { redirect } from "next/navigation";
import { DesktopLayout, PageHeading } from "@/app/desktop/_components/ui";
import { BadgeGrid } from "@/app/desktop/_components/badge-grid";
import { createClient } from "@/lib/supabase/server";
import styles from "./badge-grid.module.css";

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
  const total = badges?.length || 0;

  return (
    <DesktopLayout backTo={`/${role}/profile`} role={role} activeNav="profile">
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <PageHeading title="Badges" subtitle={total ? "Earn badges as you use Teech. Show up to 3 on your profile." : "Badges are not available yet."} />
          </div>
          {total > 0 && (
            <div className={styles.progress}>
              <div className={styles.progressTop}>
                <span><strong>{earnedCount}</strong> of {total} earned</span>
                <span>{Math.round((earnedCount / total) * 100)}%</span>
              </div>
              <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earnedCount} aria-label="Badges earned"><i style={{ width: `${(earnedCount / total) * 100}%` }} /></div>
              <small>{showcasedIds.length} of 3 shown on your profile</small>
            </div>
          )}
        </header>
        {total > 0 && <BadgeGrid badges={badges || []} earnedIds={earnedIds} showcasedIds={showcasedIds} />}
      </div>
    </DesktopLayout>
  );
}
