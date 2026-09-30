"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { Backdrop } from "./backdrop";
import styles from "./app-loader.module.css";

type Role = "student" | "faculty";

const guestPages = ["sign-in", "create-account", "forgot-password", "password-reset", "account-created"];
const bookingPages = ["calendar", "select-date-time", "appointment-info", "appointment-review"];

const loadingMessages = [
  "Getting things ready…",
  "Syncing your schedule…",
  "Checking the latest updates…",
  "Tip: check in daily to keep your streak",
];

export function AppLoader() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "desktop" || parts[0] === "mobile") parts.shift();
  const [first, ...rest] = parts;
  const role: Role | null = first === "student" || first === "faculty" ? first : null;

  if (!role || guestPages.includes(rest[0])) {
    return (
      <main className={styles.guest}>
        <Backdrop />
        <Logo />
      </main>
    );
  }

  return (
    <AppShell role={role} active={activeFor(role, rest[0])}>
      <div className={styles.content}>
        <Logo />
      </div>
    </AppShell>
  );
}

function Logo() {
  return (
    <div className={styles.status} role="status">
      <span className={styles.srOnly}>Loading Teech</span>
      <div className={styles.loader} aria-hidden="true">
        <div className={styles.logo}>
          <Image className={styles.logoImage} src="/logo/teech_logo.svg" alt="" width={1118} height={348} priority />
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
  );
}

function activeFor(role: Role, page: string | undefined) {
  if (page === "home" || !page) return "home";
  if (page === "faculty") return "faculty";
  if (page === "appointment-requests" || page === "requests" || page === "request-submitted") return "requests";
  if (role === "student" && bookingPages.includes(page)) return "faculty";
  if (page === "calendar" || page === "availability") return "calendar";
  if (page === "notifications") return "notifications";
  if (page === "points") return "points";
  if (page === "profile") return "profile";
  return "";
}
