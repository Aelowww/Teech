import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { tagline } from "./ui";
import styles from "./auth.module.css";

// Desktop sign-in / sign-up page frame: back button, "Welcome to Teech" heading, and the form card.
// Pages pass their fields in as children. `wide` gives long forms (sign-up) room for two columns.
// `below` renders under the card, outside the form (e.g. the help chat link, which has its own form).
export function AuthFrame({
  children,
  onSubmit,
  backTo,
  wide = false,
  below,
}: {
  children: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  backTo: string;
  wide?: boolean;
  below?: React.ReactNode;
}) {
  return (
    <main className={`${styles.screen} ${wide ? styles.wide : ""}`}>
      <div className={styles.circle} aria-hidden="true" />
      <div className={styles.circleBottom} aria-hidden="true" />

      <Link className={styles.back} href={backTo} aria-label="Go back">
        <ArrowLeft size={20} />
      </Link>

      <section className={styles.content}>
        <h1 className={styles.title}>
          Welcome to
          <Image className={styles.logo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
        </h1>
        <p className={styles.tagline}>&ldquo;{tagline}&rdquo;</p>

        <form className={styles.card} onSubmit={onSubmit}>
          {children}
        </form>
        {below}
      </section>

      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
    </main>
  );
}
