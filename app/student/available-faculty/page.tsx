import Link from "next/link";
import { Bell } from "lucide-react";
import { MobileLayout, BrandLogo, PageHeading, CardList, FilterTabs, SearchField } from "@/components/ui";
import styles from "./page.module.css";
export default function Page() {
  return (
    <MobileLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <Link href="/student/appointment-requests" aria-label="Notifications">
            <Bell size={19} />
          </Link>
        </header>
        <PageHeading title="Available Faculty" />
        <SearchField placeholder="Search faculty" />
        <FilterTabs filters={["All faculty", "Available"]} selected={1} />
        <CardList items={[{ "title": "Dr. Adrian Villanueva", "description": "ITPE 4 · consultation hours 9:00 AM – 4:00 PM", "status": "Available", "href": "/student/faculty-profile" }]} />
      </div>
    </MobileLayout>
  );
}

