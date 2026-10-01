import { createElement, useId, type CSSProperties } from "react";
import { badgeColors, badgeIcon } from "@/app/mobile/_components/badge-icons";
import styles from "./badge-medal.module.css";

const rosette = (() => {
  const bumps = 14;
  const inner = 24;
  const outer = 30;
  const points: string[] = [];
  for (let index = 0; index < bumps; index++) {
    const start = (index / bumps) * Math.PI * 2;
    const middle = start + Math.PI / bumps;
    const end = start + (Math.PI * 2) / bumps;
    const at = (angle: number, radius: number) => `${(32 + radius * Math.cos(angle)).toFixed(2)} ${(30 + radius * Math.sin(angle)).toFixed(2)}`;
    if (index === 0) points.push(`M${at(start, inner)}`);
    points.push(`Q${at(middle, outer)} ${at(end, inner)}`);
  }
  return `${points.join(" ")}Z`;
})();

const sparkle = "M0 -5Q0.9 -0.9 5 0Q0.9 0.9 0 5Q-0.9 0.9 -5 0Q-0.9 -0.9 0 -5Z";

export function BadgeMedal({ id, size = 64, locked = false, glitter = false, delay = 0 }: { id: string; size?: number; locked?: boolean; glitter?: boolean; delay?: number }) {
  const clipId = useId();
  const [tint, ink] = locked ? ["#f1f1f6", "#c4c3d4"] : badgeColors[id] || ["#efedfc", "#6a64c4"];
  return (
    <span
      className={`${styles.medal} ${locked ? styles.locked : ""} ${glitter ? styles.glitter : ""}`}
      style={{ "--tint": tint, "--ink": ink, "--size": `${size}px`, "--delay": `${delay}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <svg className={styles.art} viewBox="0 0 64 76">
        <path className={styles.ribbonBack} d="M20 42L12 70L19 66L24 73L30 46Z" />
        <path className={styles.ribbonFront} d="M44 42L52 70L45 66L40 73L34 46Z" />
        <g className={styles.body}>
          <path className={styles.rim} d={rosette} />
          <circle className={styles.stitch} cx="32" cy="30" r="21.5" />
          <circle className={styles.face} cx="32" cy="30" r="18" />
          <ellipse className={styles.shine} cx="25" cy="21" rx="8" ry="3.5" transform="rotate(-35 25 21)" />
          {glitter && (
            <>
              <clipPath id={clipId}><circle cx="32" cy="30" r="18" /></clipPath>
              <g clipPath={`url(#${clipId})`}>
                <g className={styles.glint}><rect x="-5" y="0" width="9" height="64" transform="rotate(25 0 30)" /></g>
              </g>
            </>
          )}
        </g>
        {!locked && (
          <g className={styles.sparkles}>
            <g transform="translate(58 8) scale(0.9)"><path d={sparkle} /></g>
            <g transform="translate(5 14) scale(0.6)"><path d={sparkle} /></g>
            <g transform="translate(60 44) scale(0.5)"><path d={sparkle} /></g>
          </g>
        )}
      </svg>
      {createElement(badgeIcon(id), { className: styles.icon, size: Math.round(size * 0.34), strokeWidth: 2.3 })}
    </span>
  );
}
