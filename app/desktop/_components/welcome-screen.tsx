"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { BriefcaseBusiness, ChevronRight, GraduationCap } from "lucide-react";
import styles from "@/app/desktop/welcome/page.module.css";

const welcomeVisitKey = "teech-welcome-seen";

const roles = [
  {
    href: "/student/sign-in",
    label: "I am a student",
    description: "Book a consultation appointment with your teacher.",
    Icon: GraduationCap,
  },
  {
    href: "/faculty/sign-in",
    label: "I am a faculty",
    description: "Set your availability for student consultations.",
    Icon: BriefcaseBusiness,
  },
];

function subscribe() {
  return () => {};
}

function getVisitStatus() {
  return window.localStorage.getItem(welcomeVisitKey) === "true";
}

export function WelcomeScreen() {
  const hasVisited = useSyncExternalStore(subscribe, getVisitStatus, () => false);

  useEffect(() => {
    window.localStorage.setItem(welcomeVisitKey, "true");
  }, []);

  return (
    <main className={styles.screen}>
      <div className={styles.circle} aria-hidden="true" />
      <div className={styles.circleBottom} aria-hidden="true" />

      <section className={styles.content}>
        <Image className={styles.logo} src="/logo/teech_logo.svg" alt="Teech" width={1118} height={348} priority />
        <h1 className={styles.title}>Who&apos;s signing in?</h1>
        <p className={styles.subtitle}>
          {hasVisited ? "Welcome back! Choose your role to continue." : "Choose your role to continue."}
        </p>

        <nav className={styles.roles} aria-label="Choose your role">
          {roles.map(({ href, label, description, Icon }) => (
            <Link key={href} className={styles.roleCard} href={href}>
              <span className={styles.roleIcon}><Icon size={28} strokeWidth={1.8} /></span>
              <span className={styles.roleText}>
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ChevronRight className={styles.chevron} size={22} />
            </Link>
          ))}
        </nav>
      </section>

      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
    </main>
  );
}
