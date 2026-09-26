import { MobileLayout, PageHeading, ActionButtons, FormField } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/select-date-time">
      <div className={styles.page}>
        <PageHeading title="Appointment Information" subtitle="Tell us a little about your consultation." />
        <div className={styles.form}>
          <FormField label="Student Name" placeholder="Bea Camille Flores" />
          <FormField label="Student ID" placeholder="65379" />
          <FormField label="Course and Year" placeholder="BSIT, 3rd Year" />
          <FormField label="Reason for Consultation" placeholder="Thesis advising, Grades, Requirements" />
          <FormField label="Additional Details" placeholder="Briefly describe what you’d like to discuss" />
        </div>
        <ActionButtons actions={[{ "label": "Review Appointment", "href": "/student/appointment-review" }]} primaryLabel="Review Appointment" />
      </div>
    </MobileLayout>
  );
}

