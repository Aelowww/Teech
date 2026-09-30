import Link from "next/link";
import Image from "next/image";
import { ArrowRight, UserRound } from "lucide-react";
import { DesktopLayout, EmptyState } from "@/app/desktop/_components/ui";
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
        id: profile.id,
        name: profile.full_name,
        details: nextOpen ? `${department} · Next open ${formatDate(nextOpen)}` : `${department} · No upcoming dates`,
        avatarSrc: profile.avatar_path ? avatarUrls.get(profile.avatar_path) : null,
        available: (profile.presence_status || "available") === "available",
        status: presenceLabels[profile.presence_status || "available"],
        href: nextOpen ? `/student/calendar?facultyId=${profile.id}&facultyName=${encodeURIComponent(profile.full_name)}` : undefined,
      };
    }) || [];

  return (
    <DesktopLayout className={styles.screen} role="student" activeNav="faculty">
      <header className={styles.pageHeader}>
        <div>
          <h1>Book a Consultation</h1>
          <p>Choose an available faculty member for your consultation.</p>
        </div>
      </header>

      <section className={styles.toolbar}>
        <div className={styles.filters} aria-label="Faculty filters">
          <Link className={showingAll ? styles.filterSelected : ""} href="/student/faculty?filter=all">All Faculty</Link>
          <Link className={!showingAll ? styles.filterSelected : ""} href="/student/faculty">Available</Link>
        </div>
      </section>

      {facultyItems.length > 0
        ? <ul className={styles.list}>
            {facultyItems.map((item) => (
              <li className={styles.card} key={item.id}>
                <span className={styles.avatar}>
                  {item.avatarSrc
                    ? <Image src={item.avatarSrc} alt="" fill sizes="80px" unoptimized />
                    : <UserRound size={32} />}
                </span>
                <div className={styles.info}>
                  <strong>{item.name}</strong>
                  <small>{item.details}</small>
                </div>
                <span className={`${styles.status} ${item.available ? styles.statusAvailable : styles.statusBusy}`}>{item.status}</span>
                {item.href
                  ? <Link className={styles.view} href={item.href} aria-label={`Book a consultation with ${item.name}`}>Book consultation <ArrowRight size={15} strokeWidth={2.5} /></Link>
                  : <span className={`${styles.view} ${styles.viewDisabled}`} aria-disabled="true">No open dates</span>}
              </li>
            ))}
          </ul>
        : <EmptyState
            title={error ? "Faculty could not be loaded" : showingAll ? "No faculty profiles" : "No faculty available"}
            description={error ? "Check the database connection and faculty records." : showingAll ? "Faculty profiles will appear here after accounts are created." : "No faculty are available right now. Check All Faculty to see who is in a meeting or in class."}
          />}
    </DesktopLayout>
  );
}

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
