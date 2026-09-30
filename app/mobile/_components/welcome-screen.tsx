import Link from "next/link";
import { BriefcaseBusiness, ChevronRight, GraduationCap } from "lucide-react";
import { BrandLogo, MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import styles from "@/app/mobile/welcome/page.module.css";

const portals = [
  {
    href: "/student/sign-in",
    title: "I am a student",
    Icon: GraduationCap,
  },
  {
    href: "/faculty/sign-in",
    title: "I am a faculty",
    Icon: BriefcaseBusiness,
  },
];

export function WelcomeScreen() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.welcome}>
          <div className={styles.circle} />
          <div className={styles.brand}><BrandLogo /></div>
          <PageHeading title={"Who's signing in?"} subtitle="Choose your role to continue." />
          <nav className={styles.roles} aria-label="Choose a portal">
            {portals.map(({ href, title, Icon }) => (
              <Link className={styles.roleCard} href={href} key={href}>
                <span className={styles.roleIcon}><Icon size={20} /></span>
                <strong className={styles.roleTitle}>{title}</strong>
                <ChevronRight className={styles.roleArrow} size={18} />
              </Link>
            ))}
          </nav>
          <div className={styles.circleBottom} />
        </div>
      </div>
    </MobileLayout>
  );
}
