"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { AuthFrame } from "./auth-frame";
import { Backdrop } from "./backdrop";
import { PageSkeleton, type SkeletonRole } from "./page-skeletons";
import styles from "./app-loader.module.css";

const guestPages = ["sign-in", "create-account", "forgot-password", "password-reset", "account-created"];
const bookingPages = ["calendar", "select-date-time", "appointment-info", "appointment-review"];

export function AppLoader() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "desktop" || parts[0] === "mobile") parts.shift();
  const [first, ...rest] = parts;
  const role: SkeletonRole | null = first === "student" || first === "faculty" ? first : null;

  if (!role) {
    return (
      <main className={styles.guest} aria-busy="true">
        <Backdrop />
        <Status />
      </main>
    );
  }

  if (guestPages.includes(rest[0])) {
    return (
      <div className={styles.skeleton} aria-busy="true">
        <Status />
        <AuthFrame backTo="/welcome" wide={rest[0] === "create-account"} onSubmit={(event) => event.preventDefault()}>
          <div className={styles.authFields}>
            {[0, 1].map((index) => <span key={index} className={styles.lines}><span className={styles.bone} style={{ width: 90, height: 12 }} /><span className={styles.bone} style={{ height: 50, borderRadius: 12 }} /></span>)}
            <span className={`${styles.bone} ${styles.end}`} style={{ width: 120, height: 12 }} />
          </div>
          <span className={`${styles.bone} ${styles.center}`} style={{ width: 160, height: 44, borderRadius: 22, marginTop: 24 }} />
          <span className={`${styles.bone} ${styles.center}`} style={{ width: 200, height: 13, marginTop: 20 }} />
        </AuthFrame>
      </div>
    );
  }

  return (
    <AppShell role={role} active={activeFor(role, rest[0])}>
      <div className={styles.skeleton} aria-busy="true">
        <Status />
        <PageSkeleton role={role} path={rest} />
      </div>
    </AppShell>
  );
}

function Status() {
  return <span className={styles.srOnly} role="status">Loading…</span>;
}

function activeFor(role: SkeletonRole, page: string | undefined) {
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
