"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { BrandLogo, MobileLayout } from "@/app/mobile/_components/ui";
import styles from "./app-loader.module.css";

const loadingMessages = [
  "Getting things ready…",
  "Syncing your schedule…",
  "Checking the latest updates…",
  "Tip: check in daily to keep your streak",
];

const handoffWindowMs = 200;
let clockStart = 0;
let mountedLoaders = 0;
let lastUnmountAt = Number.NEGATIVE_INFINITY;

function milliseconds(value: CSSNumberish | null) {
  return typeof value === "number" ? value : null;
}

function timelineNow() {
  return milliseconds(document.timeline.currentTime) ?? performance.now();
}

export function AppLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const animations = loader.getAnimations({ subtree: true });
    const now = timelineNow();

    if (mountedLoaders === 0 && now - lastUnmountAt > handoffWindowMs) {
      const started = animations.map((animation) => milliseconds(animation.startTime)).filter((time): time is number => time !== null);
      clockStart = started.length > 0 ? Math.min(...started) : now;
    }

    animations.forEach((animation) => {
      animation.startTime = clockStart;
    });
    mountedLoaders += 1;

    return () => {
      mountedLoaders -= 1;
      lastUnmountAt = timelineNow();
    };
  }, []);

  return (
    <MobileLayout className={styles.screen} fadeIn={false}>
      <div className={styles.page} role="status">
        <span className={styles.visuallyHidden}>Loading Teech</span>
        <div ref={loaderRef} className={styles.loader} aria-hidden="true">
          <div className={styles.logo}>
            <BrandLogo />
          </div>
          <svg className={styles.trail} viewBox="0 0 156 20" fill="none">
            <path d="M3 10 Q 15.5 2 28 10 T 53 10 T 78 10 T 103 10 T 128 10 T 153 10" />
          </svg>
          <p className={styles.messages}>
            {loadingMessages.map((message, index) => (
              <span key={message} style={{ "--i": index } as CSSProperties}>{message}</span>
            ))}
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
