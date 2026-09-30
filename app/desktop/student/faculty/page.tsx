import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import { DesktopLayout, EmptyState, PageHeading } from "@/app/desktop/_components/ui";
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

  const allFaculty = (faculty as FacultyProfile[] | null) || [];
  const availableCount = allFaculty.filter((profile) => (profile.presence_status || "available") === "available").length;
  const facultyItems = allFaculty
    .filter((profile) => showingAll || (profile.presence_status || "available") === "available")
    .map((profile) => {
      const nextOpen = nextOpenDates.get(profile.id);
      const presence = profile.presence_status || "available";
      return {
        id: profile.id,
        name: profile.full_name,
        department: profile.department || "Faculty member",
        presence,
        nextOpen: nextOpen ? formatDate(nextOpen) : null,
        imageUrl: profile.avatar_path ? avatarUrls.get(profile.avatar_path) : null,
        href: nextOpen ? `/student/calendar?facultyId=${profile.id}&facultyName=${encodeURIComponent(profile.full_name)}` : null,
      };
    });

  return (
    <DesktopLayout className={styles.screen} role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <PageHeading title="Book a Consultation" subtitle="Choose an available faculty member for your consultation." />
          </div>
          <nav className={styles.filters} aria-label="Faculty filters">
            <Link className={showingAll ? styles.filterSelected : ""} href="/student/faculty?filter=all" aria-current={showingAll ? "page" : undefined}>
              All Faculty<span className={styles.filterCount}>{allFaculty.length}</span>
            </Link>
            <Link className={!showingAll ? styles.filterSelected : ""} href="/student/faculty" aria-current={!showingAll ? "page" : undefined}>
              Available<span className={styles.filterCount}>{availableCount}</span>
            </Link>
          </nav>
        </header>
        {facultyItems.length > 0
          ? (
            <ul className={styles.grid}>
              {facultyItems.map((item) => {
                const content = <>
                  <span className={styles.photo}>
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt="" fill sizes="88px" unoptimized />
                      : <UserRound size={34} aria-hidden="true" />}
                    <i className={`${styles.presenceDot} ${styles[item.presence]}`} aria-hidden="true" />
                  </span>
                  <span className={styles.identity}>
                    <strong>{item.name}</strong>
                    <span>{item.department}</span>
                  </span>
                  <span className={`${styles.presence} ${styles[item.presence]}`}>{presenceLabels[item.presence]}</span>
                  <span className={styles.nextOpen}>
                    <CalendarDays size={14} aria-hidden="true" />
                    {item.nextOpen ? <>Next open <b>{item.nextOpen}</b></> : "No open dates"}
                  </span>
                  <span className={styles.book}>
                    {item.href ? <>Book consultation<ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /></> : "Not bookable yet"}
                  </span>
                </>;
                return (
                  <li key={item.id}>
                    {item.href
                      ? <Link className={styles.card} href={item.href} aria-label={`Book a consultation with ${item.name}`}>{content}</Link>
                      : <div className={`${styles.card} ${styles.cardUnavailable}`}>{content}</div>}
                  </li>
                );
              })}
            </ul>
          )
          : <EmptyState
              title={error ? "Faculty could not be loaded" : showingAll ? "No faculty profiles" : "No faculty available"}
              description={error ? "Check the database connection and faculty records." : showingAll ? "Faculty profiles will appear here after accounts are created." : "No faculty are available right now. Check All Faculty to see who is in a meeting or in class."}
            />}
      </div>
    </DesktopLayout>
  );
}

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
