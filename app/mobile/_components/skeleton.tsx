import type { CSSProperties } from "react";
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

export { styles as skeletonStyles };
