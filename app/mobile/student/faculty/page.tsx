import Link from "next/link";
import { MobileLayout, BrandLogo, CardList, EmptyState, PageHeading } from "@/app/mobile/_components/ui";
import { NotificationBell } from "@/app/mobile/_components/notification-bell";
import { createClient } from "@/lib/supabase/server";
import { avatarBucket } from "@/lib/avatar";
import styles from "./page.module.css";

type FacultyProfile = {
  id: string;
  full_name: string;
  department: string | null;
  presence_status: PresenceStatus | null;
  avatar_path: string | null;
};

type PresenceStatus = "available" | "in_meeting" | "busy";

const presenceLabels: Record<PresenceStatus, string> = {
  available: "Available",
  in_meeting: "In a meeting",
  busy: "Busy (in a class)",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const showingAll = filter === "all";
  const supabase = await createClient();
  const [{ data: faculty, error }, { data: availability }] = await Promise.all([
    supabase
    .from("profiles")
    .select("id, full_name, department, presence_status, avatar_path")
    .eq("role", "faculty")
    .order("full_name"),
    supabase.from("faculty_availability").select("faculty_profile_id, available_date").eq("is_available", true).not("available_date", "is", null).gte("available_date", manilaToday()).order("available_date"),
  ]);

  const nextOpenDates = new Map<string, string>();
  for (const slot of availability || []) {
    if (!nextOpenDates.has(slot.faculty_profile_id)) nextOpenDates.set(slot.faculty_profile_id, slot.available_date as string);
  }

  const avatarPaths = ((faculty as FacultyProfile[] | null) || []).map((profile) => profile.avatar_path).filter((path): path is string => Boolean(path));
  const { data: signedAvatars } = avatarPaths.length ? await supabase.storage.from(avatarBucket).createSignedUrls(avatarPaths, 60 * 60) : { data: [] };
  const avatarUrls = new Map((signedAvatars || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));

  const facultyItems = (faculty as FacultyProfile[] | null)
    ?.filter((profile) => showingAll || (profile.presence_status || "available") === "available")
    .map((profile) => {
      const nextOpen = nextOpenDates.get(profile.id);
      const department = profile.department || "Faculty member";
      return {
        title: profile.full_name,
        description: nextOpen ? `${department} · Next open ${formatDate(nextOpen)}` : `${department} · No upcoming dates`,
        status: presenceLabels[profile.presence_status || "available"],
        imageUrl: profile.avatar_path ? avatarUrls.get(profile.avatar_path) : null,
        href: nextOpen ? `/student/calendar?facultyId=${profile.id}&facultyName=${encodeURIComponent(profile.full_name)}` : undefined,
      };
    }) || [];

  return (
    <MobileLayout className={styles.screen} role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <NotificationBell href="/student/notifications" />
        </header>
        <PageHeading title="Book a Consultation" subtitle="Choose an available faculty member for your consultation." />
        <div className={styles.filters} aria-label="Faculty filters">
          <Link className={showingAll ? styles.filterSelected : ""} href="/student/faculty?filter=all">All Faculty</Link>
          <Link className={!showingAll ? styles.filterSelected : ""} href="/student/faculty">Available</Link>
        </div>
        {facultyItems.length > 0
          ? <CardList items={facultyItems} />
          : <EmptyState
              title={error ? "Faculty could not be loaded" : showingAll ? "No faculty profiles" : "No faculty available"}
              description={error ? "Check the database connection and faculty records." : showingAll ? "Faculty profiles will appear here after accounts are created." : "No faculty are available right now. Check All Faculty to see who is in a meeting or in class."}
            />}
      </div>
    </MobileLayout>
  );
}

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
