"use client";

import Link from "next/link";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { MobileLayout, PageHeading } from "@/app/mobile/_components/ui";
import styles from "@/app/mobile/welcome/page.module.css";

const welcomeVisitKey = "teech-welcome-seen";

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
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.welcome}>
          <div className={styles.circle} />
          <PageHeading
            title={hasVisited ? "Welcome back." : "Welcome."}
            subtitle={hasVisited ? "Choose your portal to continue." : "Tell us who is joining, so we can set things up right away."}
            display
          />
          <div className={styles.roles}>
            <Link className={styles.roleLink} href="/student/sign-in"><GraduationCap size={18} /><span>{hasVisited ? "Student Portal" : "I'm a student"}</span></Link>
            <Link className={styles.roleLink} href="/faculty/sign-in"><BriefcaseBusiness size={18} /><span>Faculty Portal</span></Link>
          </div>
          <div className={styles.circleBottom} />
        </div>
      </div>
    </MobileLayout>
  );
}
