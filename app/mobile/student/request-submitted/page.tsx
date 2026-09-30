import { ActionButtons, MobileLayout, PageHeading, StatusIndicator } from "@/app/mobile/_components/ui";
import styles from "./page.module.css";

const nextSteps = [
  "The faculty member reviews your request and the reason you gave.",
  "You'll get a notification as soon as they confirm or decline it.",
  "Plans changed? You can cancel anytime from Requests.",
  "If there's no response by the consultation date, the request expires and the time opens up again.",
];

export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="student" activeNav="requests">
      <div className={styles.page}>
        <StatusIndicator status="pending" />
        <PageHeading title="Request Submitted" subtitle="Your consultation request has been sent to the faculty member." />
        <section className={styles.steps} aria-label="What happens next">
          <h2>What happens next</h2>
          <ol>
            {nextSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
        <ActionButtons
          actions={[
            { label: "View My Requests", href: "/student/appointment-requests" },
            { label: "Back to Home", href: "/student/home" },
          ]}
          primaryLabel="View My Requests"
        />
      </div>
    </MobileLayout>
  );
}
