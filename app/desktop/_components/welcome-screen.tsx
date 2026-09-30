import Image from "next/image";
import Link from "next/link";
import { ChevronRight, GraduationCap, Presentation } from "lucide-react";
import { Backdrop } from "@/app/desktop/_components/backdrop";
import styles from "@/app/desktop/welcome/page.module.css";

const roles = [
  {
    href: "/student/sign-in",
    label: "I'm a student",
    description: "Find teachers and book consultations.",
    Icon: GraduationCap,
  },
  {
    href: "/faculty/sign-in",
    label: "I'm a faculty member",
    description: "Manage requests and your availability.",
    Icon: Presentation,
  },
];

export function WelcomeScreen() {
  return (
    <main className={styles.screen}>
      <Backdrop />

      <section className={styles.content}>
        <Image className={styles.logo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
        <h1 className={styles.title}>Who&apos;s signing in?</h1>
        <p className={styles.subtitle}>Choose your role to continue.</p>

        <nav className={styles.roles} aria-label="Choose a portal">
          {roles.map(({ href, label, description, Icon }) => (
            <Link key={href} className={styles.roleCard} href={href}>
              <span className={styles.roleIcon} aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className={styles.roleText}>
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ChevronRight className={styles.chevron} size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
