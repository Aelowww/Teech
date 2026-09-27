import Link from "next/link";
import { CalendarDays, ClipboardList } from "lucide-react";
import { MobileLayout, PageHeading } from "@/components/ui";
import styles from "./profile-settings.module.css";

type PortalRole = "student" | "faculty";

export function HelpPage({ role }: { role: PortalRole }) {
  const isStudent = role === "student";
  const firstLink = isStudent
    ? { href: "/student/faculty", label: "Book a Consultation", Icon: CalendarDays }
    : { href: "/faculty/availability", label: "Manage Availability", Icon: CalendarDays };
  const secondLink = isStudent
    ? { href: "/student/appointment-requests", label: "My Requests", Icon: ClipboardList }
    : { href: "/faculty/requests", label: "Consultation Requests", Icon: ClipboardList };

  return (
    <MobileLayout className={styles.screen} backTo={`/${role}/profile`} role={role} activeNav="profile">
      <section className={styles.page}>
        <PageHeading title="Help & Support" subtitle="Find the part of the portal you need." />
        <div className={styles.helpLinks}>
          {[firstLink, secondLink].map(({ href, label, Icon }) => (
            <Link href={href} key={href}>
              <span><Icon size={18} />{label}</span>
              <span aria-hidden="true">Open</span>
            </Link>
          ))}
        </div>
      </section>
    </MobileLayout>
  );
}
