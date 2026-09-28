import { MobileLayout, BrandLogo, ActionButtons, tagline } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.splash}>
          <BrandLogo large />
          <p className={styles.tagline}>{tagline}</p>
          <ActionButtons actions={[{ label: "Get started", href: "/welcome" }]} primaryLabel="Get started" />
        </div>
      </div>
    </MobileLayout>
  );
}

