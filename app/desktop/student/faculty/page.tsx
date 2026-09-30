import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell, House, Search, UserRound, UsersRound } from "lucide-react";
import { BrandLogo, EmptyState } from "@/app/desktop/_components/ui";
import { NotificationBell } from "@/app/desktop/_components/notification-bell";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import styles from "./page.module.css";

type FacultyProfile = {
  id: string;
  full_name: string;
  department: string | null;
  avatar_path: string | null;
};

const navItems = [
  { key: "home", label: "Home", href: "/student/home", Icon: House },
  { key: "faculty", label: "Faculty", href: "/student/faculty", Icon: UsersRound },
  { key: "notifications", label: "Notifications", href: "/student/notifications", Icon: Bell },
  { key: "profile", label: "Profile", href: "/student/profile", Icon: UserRound },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const showingAll = filter === "all";
  const supabase = await createClient();
  const [{ data: faculty, error }, { data: availability }] = await Promise.all([
    supabase
    .from("profiles")
    .select("id, full_name, department, avatar_path")
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
        id: profile.id,
        name: profile.full_name,
        department: profile.department || "Faculty member",
        avatarSrc: avatarUrl(profile.avatar_path),
        available,
        status: available ? "Available" : "No upcoming dates",
        href: available ? `/student/calendar?facultyId=${profile.id}&facultyName=${encodeURIComponent(profile.full_name)}` : undefined,
      };
    }) || [];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <BrandLogo />
        <NotificationBell className={styles.bell} href="/student/notifications" />
      </header>

      <section className={styles.searchAndFilters}>
        <label className={styles.search}>
          <Search size={20} strokeWidth={2.2} />
          <input type="search" placeholder="Search faculty" aria-label="Search faculty" />
        </label>
        <div className={styles.filters} aria-label="Faculty filters">
          <Link className={showingAll ? styles.filterSelected : ""} href="/student/faculty?filter=all">All faculty</Link>
          <Link className={!showingAll ? styles.filterSelected : ""} href="/student/faculty">Available</Link>
        </div>
      </section>

      {facultyItems.length > 0
        ? <ul className={styles.list}>
            {facultyItems.map((item) => (
              <li className={styles.card} key={item.id}>
                <span className={styles.avatar}>
                  {item.avatarSrc
                    ? <Image src={item.avatarSrc} alt="" fill sizes="64px" unoptimized />
                    : <UserRound size={28} />}
                </span>
                <div className={styles.info}>
                  <strong>{item.name}</strong>
                  <small>{item.department}</small>
                  <span className={`${styles.status} ${item.available ? styles.statusAvailable : styles.statusBusy}`}>{item.status}</span>
                </div>
                {item.href
                  ? <Link className={styles.view} href={item.href} aria-label={`View ${item.name}`}>View <ArrowRight size={12} strokeWidth={2.5} /></Link>
                  : <span className={`${styles.view} ${styles.viewDisabled}`} aria-disabled="true">View <ArrowRight size={12} strokeWidth={2.5} /></span>}
              </li>
            ))}
          </ul>
        : <EmptyState
            title={error ? "Faculty could not be loaded" : showingAll ? "No faculty profiles" : "No faculty available"}
            description={error ? "Check the database connection and faculty records." : showingAll ? "Faculty profiles will appear here after accounts are created." : "Faculty will appear here after they publish a future available date."}
          />}

      <nav className={styles.bottomNav} aria-label="Main navigation">
        {navItems.map(({ key, label, href, Icon }) => (
          <Link key={key} href={href} className={key === "faculty" ? styles.navActive : ""} aria-current={key === "faculty" ? "page" : undefined}>
            <Icon size={24} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
