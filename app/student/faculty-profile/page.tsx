import { MobileLayout, PageHeading, ActionButtons, DetailList, ProfilePhoto } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <div className={styles.page}>
        <ProfilePhoto />
        <PageHeading title="Dr. Adrian Villanueva" subtitle="Faculty, Information Technology · College of Engineering" />
        <DetailList details={[{ "label": "Faculty Office", "value": "Room 21" }, { "label": "Email", "value": "adrianv@edu.ph" }, { "label": "Office Hours", "value": "9:00 AM – 4:00 PM" }, { "label": "Consultation Days", "value": "Mon · Wed · Fri" }]} />
        <ActionButtons actions={[{ "label": "View Calendar", "href": "/student/calendar" }]} primaryLabel="View Calendar" />
      </div>
    </MobileLayout>
  );
}

