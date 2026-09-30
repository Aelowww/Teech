import Image from "next/image";
import styles from "./loader-logo.module.css";

export function LoaderLogo({ width = 170 }: { width?: number }) {
  return (
    <div className={styles.logo} style={{ width }} role="img" aria-label="Teech">
      <Image className={`${styles.layer} ${styles.kite}`} src="/teech/logo6.svg" alt="" width={402} height={125} priority unoptimized />
      <Image className={`${styles.layer} ${styles.trail}`} src="/teech/logo6.svg" alt="" width={402} height={125} priority unoptimized />
      <Image className={`${styles.layer} ${styles.word}`} src="/teech/logo6.svg" alt="" width={402} height={125} priority unoptimized />
    </div>
  );
}
