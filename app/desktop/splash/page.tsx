import { Backdrop } from "@/app/desktop/_components/backdrop";
import { tagline } from "@/app/desktop/_components/ui";
import { CtaLink } from "@/app/desktop/_components/cta-link";
import { WritingLogo } from "@/app/desktop/_components/writing-logo";
import styles from "./page.module.css";

export default function Page() {
  return (
    <main className={styles.screen}>
      <Backdrop />

      <section className={styles.hero}>
        <WritingLogo>
          <p className={styles.tagline}>{tagline}</p>
          <div className={`${styles.heroActions} ${styles.cta}`}>
            <CtaLink href="/welcome">Get started</CtaLink>
          </div>
        </WritingLogo>
      </section>
    </main>
  );
}
