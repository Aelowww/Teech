import { MobileLayout, ActionButtons, tagline } from "@/app/mobile/_components/ui";
import { WritingLogo } from "@/app/mobile/_components/writing-logo";
import styles from "./page.module.css";

export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.splash}>
          <WritingLogo>
            <p className={styles.tagline}>{tagline}</p>
            <ActionButtons actions={[{ label: "Get started", href: "/welcome" }]} primaryLabel="Get started" />
          </WritingLogo>
        </div>
      </div>
    </MobileLayout>
  );
}
