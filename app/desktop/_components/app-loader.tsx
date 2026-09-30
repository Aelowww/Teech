import { BrandLogo } from "@/app/desktop/_components/ui";
import styles from "./app-loader.module.css";

// Full-screen desktop loading state, shown while a page fetches its data or during route changes.
export function AppLoader() {
  return (
    <main className={styles.screen} aria-live="polite" aria-busy="true">
      <div className={styles.topBar} aria-hidden="true"><span /></div>
      <div className={styles.loader}>
        <BrandLogo large />
        <div className={styles.track} aria-hidden="true"><span /></div>
        <p className={styles.label}>Loading your portal…</p>
      </div>
      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
    </main>
  );
}
