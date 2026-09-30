"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./writing-logo.module.css";

const frames = [101, 165, 219, 278, 402, 402];
const fullWidth = 402;
const penSpeed = 230;
const penLift = 70;

const strokes = frames.slice(0, -1).map((width, index) => {
  const previous = index === 0 ? 0 : frames[index - 1];
  return { width, hiddenFrom: 100 - (previous / width) * 100, duration: ((width - previous) / penSpeed) * 1000 };
});

const timeline = strokes.reduce<{ start: number; duration: number; hiddenFrom: number }[]>((list, stroke) => {
  const start = list.length ? list[list.length - 1].start + list[list.length - 1].duration + penLift : 0;
  return [...list, { start, duration: stroke.duration, hiddenFrom: stroke.hiddenFrom }];
}, []);

const writingTime = timeline[timeline.length - 1].start + timeline[timeline.length - 1].duration;

export function WritingLogo({ children }: { children?: React.ReactNode }) {
  const [loaded, setLoaded] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const playing = loaded >= frames.length || timedOut;

  useEffect(() => {
    const fallback = window.setTimeout(() => setTimedOut(true), 2500);
    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <div className={`${styles.intro} ${playing ? styles.playing : ""}`} style={{ "--written": `${writingTime}ms` } as CSSProperties}>
      <div className={styles.logo} role="img" aria-label="Teech">
        {frames.map((width, index) => {
          const isFinal = index === frames.length - 1;
          const stroke = timeline[index];
          const strokeStyle = stroke
            ? { "--start": `${stroke.start}ms`, "--duration": `${stroke.duration}ms`, "--hidden-from": `${stroke.hiddenFrom}%` }
            : {};
          return (
            <Image
              key={index}
              className={`${styles.frame} ${isFinal ? styles.finalFrame : styles.strokeFrame}`}
              src={`/teech/logo${index + 1}.svg`}
              alt=""
              width={width}
              height={125}
              priority
              onLoad={() => setLoaded((count) => count + 1)}
              style={{ width: `${(width / fullWidth) * 100}%`, height: "auto", ...strokeStyle } as CSSProperties}
            />
          );
        })}
      </div>
      {children && <div className={styles.reveal}>{children}</div>}
    </div>
  );
}
