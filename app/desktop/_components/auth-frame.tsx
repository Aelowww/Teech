import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { Backdrop } from "./backdrop";
import { tagline } from "./ui";
import styles from "./auth.module.css";

export function AuthSubmit({
  label,
  pendingLabel,
  pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <button className={styles.submitButton} type="submit" disabled={pending} aria-busy={pending}>
      <span>{pending ? pendingLabel : label}</span>
      {pending ? (
        <LoaderCircle className={styles.submitSpinner} size={16} strokeWidth={2.25} aria-hidden="true" />
      ) : (
        <ArrowRight className={styles.submitArrow} size={16} strokeWidth={2.25} aria-hidden="true" />
      )}
    </button>
  );
}

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
      <Backdrop />

      <Link className={styles.back} href={backTo} aria-label="Go back">
        <ArrowLeft size={18} />
      </Link>

      <section className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <Image className={styles.logo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
          </h1>
          <p className={styles.tagline}>{tagline}</p>
        </header>

        <form className={styles.card} onSubmit={onSubmit}>
          {children}
        </form>
        {below}
      </section>
    </main>
  );
}
