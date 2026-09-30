import styles from "./backdrop.module.css";

export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <span className={`${styles.glow} ${styles.glowTop}`} />
      <span className={`${styles.glow} ${styles.glowBottom}`} />
    </div>
  );
}
