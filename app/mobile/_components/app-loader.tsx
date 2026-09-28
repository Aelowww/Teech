import { BrandLogo, MobileLayout } from "@/app/mobile/_components/ui";
import styles from "./app-loader.module.css";

export function AppLoader() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page} aria-live="polite" aria-label="Loading">
        <div className={styles.loader}>
          <BrandLogo />
          <div className={styles.dots} aria-hidden="true"><i /><i /><i /></div>
        </div>
      </div>
    </MobileLayout>
  );
}
