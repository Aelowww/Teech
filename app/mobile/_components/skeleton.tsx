import type { CSSProperties } from "react";
import { MobileLayout } from "@/app/mobile/_components/ui";
import styles from "./skeleton.module.css";

type Size = number | string;

export function Bone({
  width,
  height,
  radius,
  round = false,
  pill = false,
  center = false,
  onDark = false,
  style,
}: {
  width?: Size;
  height: Size;
  radius?: number;
  round?: boolean;
  pill?: boolean;
  center?: boolean;
  onDark?: boolean;
  style?: CSSProperties;
}) {
  const className = [
    styles.bone,
    round && styles.round,
    pill && styles.pill,
    center && styles.center,
    onDark && styles.onDark,
  ].filter(Boolean).join(" ");
  return <span className={className} style={{ width: width ?? height, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

/**
 * A bone that stands in for one line of text. Its margins fill out the rest of the
 * line box, so it takes up the same height as the real text at that font size.
 */
export function TextBone({
  size,
  width,
  lineHeight = 1.3,
  center = false,
  onDark = false,
}: {
  size: number;
  width: Size;
  lineHeight?: number;
  center?: boolean;
  onDark?: boolean;
}) {
  const height = Math.round(size * 0.72);
  const gap = (size * lineHeight - height) / 2;
  return <Bone width={width} height={height} radius={4} center={center} onDark={onDark} style={{ marginBlock: gap }} />;
}

/** The real screen frame (back button, bottom nav) with placeholder content inside. */
export function SkeletonScreen({
  className,
  pageClassName,
  backTo,
  role,
  activeNav,
  children,
}: {
  className?: string;
  pageClassName?: string;
  backTo?: string;
  role?: "student" | "faculty";
  activeNav?: string;
  children: React.ReactNode;
}) {
  return (
    <MobileLayout className={className} backTo={backTo} role={role} activeNav={activeNav} fadeIn={false}>
      <div className={pageClassName} aria-busy="true">
        <span className={styles.srOnly} role="status">Loading…</span>
        {children}
      </div>
    </MobileLayout>
  );
}

export { styles as skeletonStyles };
