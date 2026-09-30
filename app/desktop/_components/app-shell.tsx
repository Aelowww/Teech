import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, ClipboardList, GraduationCap, House, Search, Sparkles, UserRound, UsersRound } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { ShellProfile } from "./shell-profile";
import { SupportChat } from "./support-chat";
import styles from "./app-shell.module.css";

type Role = "student" | "faculty";

// `key` matches the `activeNav` / `active` value each page passes in.
const navItems = {
  student: [
    { key: "home", label: "Home", href: "/student/home", Icon: House },
    { key: "faculty", label: "Find Faculty", href: "/student/faculty", Icon: UsersRound },
    { key: "requests", label: "My Requests", href: "/student/appointment-requests", Icon: ClipboardList },
    { key: "notifications", label: "Notifications", href: "/student/notifications", Icon: Bell },
    { key: "points", label: "Points & Rewards", href: "/student/points", Icon: Sparkles },
    { key: "profile", label: "Profile & Settings", href: "/student/profile", Icon: UserRound },
  ],
  faculty: [
    { key: "home", label: "Home", href: "/faculty/home", Icon: House },
    { key: "calendar", label: "Calendar", href: "/faculty/calendar", Icon: CalendarDays },
    { key: "requests", label: "Requests", href: "/faculty/requests", Icon: ClipboardList },
    { key: "notifications", label: "Notifications", href: "/faculty/notifications", Icon: Bell },
    { key: "points", label: "Points & Rewards", href: "/faculty/points", Icon: Sparkles },
    { key: "profile", label: "Profile & Settings", href: "/faculty/profile", Icon: UserRound },
  ],
};

// Desktop website frame for signed-in screens: sticky top header, left sidebar, and a wide content area.
// Pages that already loaded the profile pass name/subtitle/avatarSrc; otherwise the sidebar loads it itself.
export function AppShell({
  role,
  active,
  name,
  subtitle,
  avatarSrc,
  backTo,
  className,
  children,
}: {
  role: Role;
  active: string;
  name?: string;
  subtitle?: string;
  avatarSrc?: string | null;
  backTo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href={`/${role}/home`}>
          <span className={styles.brandIcon}><GraduationCap size={22} /></span>
          <div><strong>Teech</strong><small>{role === "student" ? "Student Portal" : "Faculty Portal"}</small></div>
        </Link>
        <div className={styles.actions}>
          <label className={styles.search}>
            <Search size={18} />
            <input type="search" placeholder={role === "student" ? "Search faculty, appointments..." : "Search requests, students..."} aria-label="Search" />
          </label>
          <NotificationBell className={styles.iconButton} href={`/${role}/notifications`} />
          <Link className={styles.iconButton} href={`/${role}/profile`} aria-label="Profile"><UserRound size={20} /></Link>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <ShellProfile role={role} name={name} subtitle={subtitle} avatarSrc={avatarSrc} />
          <nav className={styles.nav} aria-label="Main navigation">
            {navItems[role].map(({ key, label, href, Icon }) => (
              <Link key={key} href={href} className={`${styles.navItem} ${active === key ? styles.navActive : ""}`} aria-current={active === key ? "page" : undefined}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <small>Need help?</small>
            <SupportChat audience={role} variant="row" className={styles.helpButton} />
          </div>
        </aside>

        <main className={[styles.main, className].filter(Boolean).join(" ")}>
          {backTo && <Link className={styles.back} href={backTo}><ArrowLeft size={16} />Back</Link>}
          {children}
        </main>
      </div>

      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
    </div>
  );
}
