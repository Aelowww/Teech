import Link from "next/link";
import Image from "next/image";
import { CalendarDays, UserRound } from "lucide-react";
import { MobileLayout, BrandLogo, EmptyState } from "@/app/mobile/_components/ui";
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
  const showingAll = filter !== "available";
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
  const isBookableNow = (profile: FacultyProfile) => (profile.presence_status || "available") === "available" && nextOpenDates.has(profile.id);
  const availableCount = allFaculty.filter(isBookableNow).length;
  const presenceOrder: Record<string, number> = { available: 0, in_meeting: 1, busy: 2 };
  const facultyItems = allFaculty
    .filter((profile) => showingAll || isBookableNow(profile))
    .sort((first, second) => presenceOrder[first.presence_status || "available"] - presenceOrder[second.presence_status || "available"])
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
    <MobileLayout className={styles.screen} role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <NotificationBell href="/student/notifications" />
        </header>
        <div className={styles.intro}>
          <h1>Book a consultation</h1>
          <p>Pick a faculty member to see their open dates.</p>
        </div>
        <nav className={styles.filters} aria-label="Faculty filters">
          <Link className={showingAll ? styles.filterSelected : ""} href="/student/faculty" aria-current={showingAll ? "page" : undefined}>
            All Faculty<span className={styles.filterCount}>{allFaculty.length}</span>
          </Link>
          <Link className={!showingAll ? styles.filterSelected : ""} href="/student/faculty?filter=available" aria-current={!showingAll ? "page" : undefined}>
            Available<span className={styles.filterCount}>{availableCount}</span>
          </Link>
        </nav>
        {facultyItems.length > 0
          ? (
            <ul className={styles.list}>
              {facultyItems.map((item) => {
                const content = <>
                  <span className={styles.avatar}>
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt="" fill sizes="48px" unoptimized />
                      : <UserRound size={20} aria-hidden="true" />}
                    <i className={`${styles.presenceDot} ${styles[item.presence]}`} aria-hidden="true" />
                  </span>
                  <span className={styles.info}>
                    <strong>{item.name}</strong>
                    <span className={styles.meta}>
                      {item.department}
                      <em className={`${styles.pill} ${styles[item.presence]}`}>{presenceLabels[item.presence]}</em>
                    </span>
                  </span>
                  <span className={`${styles.dateChip} ${item.nextOpen ? "" : styles.dateChipEmpty}`}>
                    {item.nextOpen ? <><CalendarDays size={12} aria-hidden="true" />{item.nextOpen}</> : "No dates"}
                  </span>
                </>;
                return (
                  <li key={item.id}>
                    {item.href
                      ? <Link className={`${styles.row} ${item.presence === "available" ? "" : styles.rowAway}`} href={item.href} aria-label={`${item.name}, ${presenceLabels[item.presence]}, next open ${item.nextOpen}`}>{content}</Link>
                      : <div className={`${styles.row} ${styles.rowUnavailable}`}>{content}</div>}
                  </li>
                );
              })}
            </ul>
          )
          : <EmptyState
              scene={error ? "error" : showingAll ? "inbox" : "busy"}
              action={error ? { label: "Try again", href: "/student/faculty" } : showingAll ? { label: "Back to dashboard", href: "/student/home" } : { label: "See all faculty", href: "/student/faculty" }}
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
