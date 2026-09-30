import Link from "next/link";
import { ArrowRight, GraduationCap, Presentation } from "lucide-react";
import { BrandLogo, MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import styles from "@/app/mobile/welcome/page.module.css";

const portals = [
  {
    href: "/student/sign-in",
    title: "I'm a student",
    Icon: GraduationCap,
  },
  {
    href: "/faculty/sign-in",
    title: "I'm a faculty member",
    Icon: Presentation,
  },
];

export function WelcomeScreen() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.welcome}>
          <div className={styles.brand}><BrandLogo /></div>
          <PageHeading title={"Who's signing in?"} subtitle="Choose your role to continue." />
          <nav className={styles.roles} aria-label="Choose a portal">
            {portals.map(({ href, title, Icon }) => (
              <Link className={styles.roleCard} href={href} key={href}>
                <span className={styles.roleIcon} aria-hidden="true"><Icon size={21} strokeWidth={1.75} /></span>
                <strong className={styles.roleTitle}>{title}</strong>
                <ArrowRight className={styles.roleArrow} size={18} strokeWidth={2} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </MobileLayout>
  );
}
