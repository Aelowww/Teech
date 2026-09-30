"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { Backdrop } from "./backdrop";
import { LoaderLogo } from "./loader-logo";
import styles from "./app-loader.module.css";

type Role = "student" | "faculty";

const guestPages = ["sign-in", "create-account", "forgot-password", "password-reset", "account-created"];
const bookingPages = ["calendar", "select-date-time", "appointment-info", "appointment-review"];

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
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.srOnly}>Loading…</span>
      <LoaderLogo width={220} />
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
