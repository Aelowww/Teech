import { DesktopLayout, BrandLogo, ActionButtons } from "@/app/desktop/_components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <DesktopLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.splash}>
          <BrandLogo large />
          <p className={styles.tagline}>Learn. Connect. Grow.</p>
          <ActionButtons actions={[{ label: "Get started", href: "/welcome" }]} primaryLabel="Get started" />
        </div>
      </div>
    </DesktopLayout>
  );
}

