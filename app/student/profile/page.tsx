import { MobileLayout, PageHeading, ActionButtons, DetailList, ProfilePhoto } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="student" activeNav="profile">
      <div className={styles.page}>
        <ProfilePhoto />
        <PageHeading title="Bea Camille Flores" subtitle="Student, Information Technology · College of Engineering" />
        <DetailList details={[{ "label": "Full Name", "value": "Bea Camille Flores" }, { "label": "Email Address", "value": "beacams@gmail.com" }, { "label": "Department", "value": "Information Technology" }, { "label": "College", "value": "College of Engineering" }, { "label": "Student ID", "value": "65379" }]} />
        <ActionButtons actions={[{ "label": "Log Out", "href": "/welcome", "tone": "danger" }]} primaryLabel="Log Out" />
      </div>
    </MobileLayout>
  );
}

