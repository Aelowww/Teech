import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";
import { MobileLayout, BrandLogo, ActionButtons, CardList, ProfilePhoto } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} role="teacher" activeNav="home">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <Link href="/teacher/notifications" aria-label="Notifications">
            <Bell size={19} />
          </Link>
        </header>
        <div className={styles.greeting}>
          <ProfilePhoto inline />
          <div>
            <strong>Good morning,</strong>
            <small>Dr. Adrian Villanueva</small>
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
            <strong>3</strong>
            <span>Pending Request</span>
          </div>
          <div className={styles.metric} key="Appointments Today">
            <strong>2</strong>
            <span>Appointments Today</span>
          </div>
          <div className={styles.metric} key="Available Slots">
            <strong>5</strong>
            <span>Available Slots</span>
          </div>
        </div>
        <h2 className={styles.sectionTitle}>Calendar <small>(This Week)</small>
        </h2>
        <div className={styles.weekStrip}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => <div key={day}>
          <small>{day}</small>
          <span className={index === 5 ? styles.selectedDate : ""}>{16 + index}</span>
        </div>)}</div>
        <h2 className={styles.sectionTitle}>Confirmed Request</h2>
        <CardList items={[{ "title": "Appointment Confirmed", "description": "Dr. Adrian Villanueva · August 21, 2026 · 10:00 AM", "status": "Confirmed", "href": "/student/appointment-confirmed" }]} />
        <ActionButtons className={styles.dashboardActions} actions={[{ "label": "Manage Availability", "href": "/teacher/availability" }, { "label": "View Requests", "href": "/teacher/notifications" }]} />
      </div>
    </MobileLayout>
  );
}
