import { MobileLayout, PageHeading, ActionLink } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen}>
      <div className={styles.page}>
        <div className={styles.welcome}>
          <div className={styles.circle} />
          <PageHeading title="Welcome." subtitle="Tell us who’s joining, so we can set things up right away." display />
          <div className={styles.roles}>
            <ActionLink action={{ label: "I’m a student", href: "/student/sign-in" }} />
            <ActionLink action={{ label: "I’m a Teacher", href: "/teacher/sign-in" }} />
          </div>
          <div className={styles.circleBottom} />
        </div>
      </div>
    </MobileLayout>
  );
}

