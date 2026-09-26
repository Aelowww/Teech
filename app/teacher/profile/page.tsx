import { MobileLayout, PageHeading, ActionButtons, DetailList, ProfilePhoto } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="teacher" activeNav="profile">
      <div className={styles.page}>
        <ProfilePhoto />
        <PageHeading title="Dr. Adrian Villanueva" subtitle="Faculty, Information Technology · College of Engineering" />
        <DetailList details={[{ "label": "Full Name", "value": "Dr. Adrian Villanueva" }, { "label": "Email Address", "value": "adrianv@edu.ph" }, { "label": "Department", "value": "Information Technology" }, { "label": "College", "value": "College of Engineering" }, { "label": "Faculty ID", "value": "WIT-2026-1234" }]} />
        <ActionButtons actions={[{ "label": "Log Out", "href": "/welcome", "tone": "danger" }]} primaryLabel="Log Out" />
      </div>
    </MobileLayout>
  );
}

