import Link from "next/link";
import { MobileLayout, BrandLogo, CardList, EmptyState, PageHeading } from "@/app/mobile/_components/ui";
import { NotificationBell } from "@/app/mobile/_components/notification-bell";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type FacultyProfile = {
  id: string;
  full_name: string;
  department: string | null;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const showingAll = filter === "all";
  const supabase = await createClient();
  const [{ data: faculty, error }, { data: availability }] = await Promise.all([
    supabase
    .from("profiles")
    .select("id, full_name, department")
    .eq("role", "faculty")
    .order("full_name"),
    supabase.from("faculty_availability").select("faculty_profile_id, available_date").eq("is_available", true).not("available_date", "is", null).gte("available_date", manilaToday()).order("available_date"),
  ]);

  const nextOpenDates = new Map<string, string>();
  for (const slot of availability || []) {
    if (!nextOpenDates.has(slot.faculty_profile_id)) nextOpenDates.set(slot.faculty_profile_id, slot.available_date as string);
  }

  const facultyItems = (faculty as FacultyProfile[] | null)
    ?.filter((profile) => showingAll || nextOpenDates.has(profile.id))
    .map((profile) => {
      const nextOpen = nextOpenDates.get(profile.id);
      const available = Boolean(nextOpen);
      return {
        title: profile.full_name,
        description: nextOpen ? `${profile.department || "Faculty member"} · Next open ${formatDate(nextOpen)}` : profile.department || "Faculty member",
        status: available ? "Available" : "No upcoming dates",
        href: available ? `/student/calendar?facultyId=${profile.id}&facultyName=${encodeURIComponent(profile.full_name)}` : undefined,
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
              description={error ? "Check the database connection and faculty records." : showingAll ? "Faculty profiles will appear here after accounts are created." : "Faculty will appear here after they publish a future available date."}
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
