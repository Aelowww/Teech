import { MobileLayout, tagline } from "@/app/mobile/_components/ui";
import { WritingLogo } from "@/app/mobile/_components/writing-logo";
import { CtaLink } from "@/app/mobile/_components/cta-link";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.splash}>
          <WritingLogo>
            <p className={styles.tagline}>{tagline}</p>
            <div className={styles.cta}>
              <CtaLink href="/welcome">Get started</CtaLink>
            </div>
          </WritingLogo>
        </div>
      </div>
    </MobileLayout>
  );
}
