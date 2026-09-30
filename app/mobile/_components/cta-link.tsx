"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import styles from "./cta-link.module.css";

type Ripple = { id: number; x: number; y: number; size: number };

const defaultNavigationDelayMs = 220;

export function CtaLink({
  href,
  children,
  className,
  fullWidth = false,
  navigationDelayMs = defaultNavigationDelayMs,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  navigationDelayMs?: number;
}) {
  const router = useRouter();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pressed, setPressed] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    if (pressed) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const fromKeyboard = event.detail === 0;
    const ripple: Ripple = {
      id: Date.now(),
      x: fromKeyboard ? rect.width / 2 : event.clientX - rect.left,
      y: fromKeyboard ? rect.height / 2 : event.clientY - rect.top,
      size: Math.hypot(rect.width, rect.height) * 2,
    };

    setRipples((current) => [...current, ripple]);
    setPressed(true);
    timers.current.push(
      window.setTimeout(() => router.push(href), navigationDelayMs),
      window.setTimeout(() => setPressed(false), navigationDelayMs + 600),
    );
  }

  return (
    <Link
      href={href}
      className={`${styles.button} ${fullWidth ? styles.fullWidth : ""} ${pressed ? styles.pressed : ""} ${className || ""}`}
      onClick={handleClick}
    >
      <span className={styles.label}>{children}</span>
      <span className={styles.icon} aria-hidden="true"><ArrowRight size={15} strokeWidth={2.4} /></span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{ "--x": `${ripple.x}px`, "--y": `${ripple.y}px`, "--size": `${ripple.size}px` } as CSSProperties}
          onAnimationEnd={() => setRipples((current) => current.filter((item) => item.id !== ripple.id))}
          aria-hidden="true"
        />
      ))}
    </Link>
  );
}
