import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tagline } from "@/app/desktop/_components/ui";
import { WritingLogo } from "@/app/desktop/_components/writing-logo";
import styles from "./page.module.css";

export default function Page() {
  return (
    <main className={styles.screen}>
      <div className={styles.circle} aria-hidden="true" />
      <div className={styles.circleBottom} aria-hidden="true" />

      <section className={styles.hero}>
        <WritingLogo>
          <p className={styles.tagline}>{tagline}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/welcome">Get started<ArrowRight size={18} /></Link>
          </div>
        </WritingLogo>
      </section>
    </main>
  );
}
