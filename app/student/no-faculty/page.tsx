import { UsersRound } from "lucide-react";
import { MobileLayout, BrandLogo, PageHeading, FilterTabs, SearchField } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <NotificationBell href="/student/notifications" />
        </header>
        <PageHeading title="No faculty available" />
        <SearchField placeholder="Search faculty" />
        <FilterTabs filters={["All faculty", "Available"]} selected={1} />
        <div className={styles.empty}>
          <UsersRound size={42} />
          <strong>No faculty available</strong>
          <p>Nobody is taking consultations right now. Check back later or browse the full faculty list.</p>
        </div>
      </div>
    </MobileLayout>
  );
}
