import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { MobileLayout, BrandLogo, ActionButtons, CardList, ProfilePhoto } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="student" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <Link href="/student/appointment-requests" aria-label="Notifications">
            <Bell size={19} />
          </Link>
        </header>
        <div className={styles.greeting}>
          <ProfilePhoto inline />
          <div>
            <strong>Good morning,</strong>
            <small>Bea Camille Flores</small>
          </div>
        </div>
        <div className={styles.availability}>
          <span className={styles.availabilityLabel}>Status</span>
          <div className={styles.availabilitySelect}>
            <i />
            <span>Available</span>
            <ChevronDown size={14} />
          </div>
        </div>
        <div className={styles.metrics}>
          <div className={styles.metric} key="Pending Request">
            <strong>0</strong>
            <span>Pending Request</span>
          </div>
          <div className={styles.metric} key="Upcoming Appointment">
            <strong>1</strong>
            <span>Upcoming Appointment</span>
          </div>
          <div className={styles.metric} key="Available Faculty">
            <strong>4</strong>
            <span>Available Faculty</span>
          </div>
        </div>
        <h2 className={styles.sectionTitle}>Calendar <small>(This Week)</small>
        </h2>
        <div className={styles.weekStrip}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <div key={day}>
          <small>{day}</small>
          <span className={index === 5 ? styles.selectedDate : ""}>{16 + index}</span>
        </div>)}</div>
        <h2 className={styles.sectionTitle}>Pending Request</h2>
        <CardList items={[{ "title": "Appointment Confirmed", "description": "Dr. Adrian Villanueva · August 21, 2026 · 10:00 AM", "status": "Confirmed", "href": "/student/appointment-confirmed" }]} />
        <ActionButtons className={styles.dashboardActions} actions={[{ "label": "Find a Faculty", "href": "/student/faculty" }, { "label": "Book a Consultation", "href": "/student/calendar" }]} />
      </div>
    </MobileLayout>
  );
}
