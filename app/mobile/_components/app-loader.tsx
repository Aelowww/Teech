"use client";

import { MobileLayout } from "./ui";
import { LoaderLogo } from "./loader-logo";
import styles from "./app-loader.module.css";

export function AppLoader() {
  return (
    <MobileLayout className={styles.screen} fadeIn={false}>
      <div className={styles.loader} role="status" aria-live="polite">
        <span className={styles.srOnly}>Loading…</span>
        <LoaderLogo width={170} />
      </div>
    </MobileLayout>
  );
}
