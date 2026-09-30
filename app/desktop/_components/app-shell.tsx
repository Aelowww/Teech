import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ClipboardList, GraduationCap, House, MessageSquare, Search, Settings, UserRound, UsersRound } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import styles from "./app-shell.module.css";

type Role = "student" | "faculty";

const navItems = {
  student: [
    { key: "home", label: "Home", href: "/student/home", Icon: House },
    { key: "faculty", label: "Faculty", href: "/student/faculty", Icon: UsersRound },
    { key: "appointments", label: "Appointments", href: "/student/appointment-requests", Icon: CalendarDays },
    { key: "messages", label: "Messages", href: "/student/notifications", Icon: MessageSquare },
    { key: "settings", label: "Settings", href: "/student/profile", Icon: Settings },
  ],
  faculty: [
    { key: "home", label: "Home", href: "/faculty/home", Icon: House },
    { key: "calendar", label: "Calendar", href: "/faculty/calendar", Icon: CalendarDays },
    { key: "requests", label: "Requests", href: "/faculty/requests", Icon: ClipboardList },
    { key: "messages", label: "Messages", href: "/faculty/notifications", Icon: MessageSquare },
    { key: "settings", label: "Settings", href: "/faculty/profile", Icon: Settings },
  ],
};

// Desktop page frame for signed-in screens: top header, left sidebar, and the page content.
export function AppShell({
  role,
  active,
  name,
  subtitle,
  avatarSrc,
  children,
}: {
  role: Role;
  active: string;
  name: string;
  subtitle: string;
  avatarSrc?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}><GraduationCap size={22} /></span>
          <div><strong>Teech</strong><small>{name}</small></div>
        </div>
        <div className={styles.actions}>
          <label className={styles.search}>
            <Search size={18} />
            <input type="search" placeholder="Search faculty, appointments..." aria-label="Search faculty and appointments" />
          </label>
          <NotificationBell className={styles.iconButton} href={`/${role}/notifications`} />
          <Link className={styles.iconButton} href={`/${role}/profile`} aria-label="Profile"><UserRound size={20} /></Link>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <span className={styles.avatar}>
              {avatarSrc ? <Image src={avatarSrc} alt="" fill sizes="56px" unoptimized /> : <UserRound size={24} />}
            </span>
            <div><strong>{name}</strong><small>{subtitle}</small></div>
          </div>
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
            <Link className={styles.pillButton} href={`/${role}/home`}>Back to Home</Link>
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
