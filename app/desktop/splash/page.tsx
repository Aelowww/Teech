import Link from "next/link";
import { ArrowRight, Award, CalendarCheck2, Clock3, UsersRound } from "lucide-react";
import { tagline } from "@/app/desktop/_components/ui";
import { WritingLogo } from "@/app/desktop/_components/writing-logo";
import styles from "./page.module.css";

const features = [
  { Icon: UsersRound, title: "Find your faculty", text: "See who is available right now and when they have open consultation dates." },
  { Icon: CalendarCheck2, title: "Book in a few clicks", text: "Pick a date and time, add your reason, and send the request. No emails back and forth." },
  { Icon: Clock3, title: "Stay in the loop", text: "Get notified the moment a request is confirmed, declined, or cancelled." },
  { Icon: Award, title: "Earn as you go", text: "Daily check-ins build your streak, earn points, and unlock badges." },
];

// Landing page: top bar, hero with the animated logo, and a row of features.
export default function Page() {
  return (
    <main className={styles.screen}>
      <div className={styles.circle} aria-hidden="true" />
      <div className={styles.circleBottom} aria-hidden="true" />

      <header className={styles.topBar}>
        <span className={styles.brand}>Teech</span>
        <nav>
          <Link href="/student/sign-in">Student sign in</Link>
          <Link href="/faculty/sign-in">Faculty sign in</Link>
          <Link className={styles.topCta} href="/welcome">Get started</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <WritingLogo>
          <p className={styles.tagline}>{tagline}</p>
          <h1 className={styles.headline}>Book consultations with your teachers, without the back-and-forth.</h1>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/welcome">Get started<ArrowRight size={18} /></Link>
            <Link className={styles.secondary} href="/student/sign-in">I already have an account</Link>
          </div>
        </WritingLogo>
      </section>

      <section className={styles.features} aria-label="What you can do with Teech">
        {features.map(({ Icon, title, text }) => (
          <article key={title}>
            <span><Icon size={22} /></span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
    </main>
  );
}
