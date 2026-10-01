import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NavIcon, type NavIconName } from "./nav-icons";
import { NotificationBell } from "./notification-bell";
import { ShellProfile } from "./shell-profile";
import { SupportChat } from "./support-chat";
import styles from "./app-shell.module.css";

type Role = "student" | "faculty";

const navItems: Record<Role, { key: string; label: string; href: string; icon: NavIconName }[]> = {
  student: [
    { key: "home", label: "Home", href: "/student/home", icon: "house" },
    { key: "faculty", label: "Faculty", href: "/student/faculty", icon: "users" },
    { key: "requests", label: "Requests", href: "/student/appointment-requests", icon: "clipboard" },
<<<<<<< HEAD
    { key: "notifications", label: "Notifications", href: "/student/notifications", icon: "bell" },
=======
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    { key: "points", label: "Points & Rewards", href: "/student/points", icon: "sparkles" },
    { key: "profile", label: "Profile", href: "/student/profile", icon: "profile" },
  ],
  faculty: [
    { key: "home", label: "Home", href: "/faculty/home", icon: "house" },
    { key: "calendar", label: "Calendar", href: "/faculty/calendar", icon: "calendar" },
    { key: "requests", label: "Requests", href: "/faculty/requests", icon: "clipboard" },
<<<<<<< HEAD
    { key: "notifications", label: "Notifications", href: "/faculty/notifications", icon: "bell" },
=======
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    { key: "points", label: "Points & Rewards", href: "/faculty/points", icon: "sparkles" },
    { key: "profile", label: "Profile", href: "/faculty/profile", icon: "profile" },
  ],
};

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
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link className={styles.brand} href={`/${role}/home`}>
            <Image className={styles.brandLogo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
          </Link>
          <NotificationBell className={styles.iconButton} href={`/${role}/notifications`} />
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {navItems[role].map(({ key, label, href, icon }) => (
            <Link key={key} href={href} className={`${styles.navItem} ${active === key ? styles.navActive : ""}`} aria-current={active === key ? "page" : undefined} title={label}>
              <NavIcon name={icon} filled={active === key} size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <SupportChat audience={role} variant="row" className={styles.helpButton} />
          <ShellProfile role={role} name={name} subtitle={subtitle} avatarSrc={avatarSrc} />
        </div>
      </aside>

      <main className={[styles.main, className].filter(Boolean).join(" ")}>
        {backTo && <Link className={styles.back} href={backTo}><ArrowLeft size={16} />Back</Link>}
        {children}
      </main>
    </div>
  );
}
