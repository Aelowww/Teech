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
    supabase.from("faculty_availability").select("faculty_profile_id").eq("is_available", true).not("available_date", "is", null).gte("available_date", new Date().toISOString().slice(0, 10)),
  ]);

  const availableFacultyIds = new Set(availability?.map((slot) => slot.faculty_profile_id) || []);

  const facultyItems = (faculty as FacultyProfile[] | null)
    ?.filter((profile) => showingAll || availableFacultyIds.has(profile.id))
    .map((profile) => {
      const available = availableFacultyIds.has(profile.id);
      return {
        title: profile.full_name,
        description: profile.department || "Faculty member",
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
