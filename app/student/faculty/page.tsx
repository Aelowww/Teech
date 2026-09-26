"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Search } from "lucide-react";
import { MobileLayout, BrandLogo, CardList } from "@/components/ui";
import styles from "./page.module.css";

const faculty = [
  {
    title: "Dr. Adrian Villanueva",
    description: "ITPE 4 · consultation hours 9:00 AM – 4:00 PM",
    status: "Available",
    href: "/student/faculty-profile",
  },
  {
    title: "Prof. Camille Reyes",
    description: "ITPE 4 · next slot tomorrow",
    status: "Busy",
    href: "/student/faculty-profile",
  },
  {
    title: "Dr. Nathaniel Soriano",
    description: "ITPE 4 · in a meeting",
    status: "In a Meeting",
    href: "/student/faculty-profile",
  },
  {
    title: "Prof. Isabella Montes",
    description: "ITPE 4 · in a meeting",
    status: "In a Meeting",
    href: "/student/faculty-profile",
  },
];

export default function Page() {
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [query, setQuery] = useState("");
  const visibleFaculty = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return faculty.filter((person) => {
      const matchesAvailability = filter === "all" || person.status === "Available";
      const matchesSearch = !normalizedQuery
        || `${person.title} ${person.description} ${person.status}`.toLowerCase().includes(normalizedQuery);
      return matchesAvailability && matchesSearch;
    });
  }, [filter, query]);

  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="faculty">
      <div className={styles.page}>
        <header className={styles.header}>
          <BrandLogo />
          <Link className={styles.notifications} href="/student/appointment-requests" aria-label="Notifications">
            <Bell size={19} />
          </Link>
        </header>
        <label className={styles.search}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search faculty"
            aria-label="Search faculty"
          />
        </label>
        <div className={styles.filters} aria-label="Filter faculty">
          <button
            type="button"
            aria-pressed={filter === "all"}
            className={filter === "all" ? styles.filterSelected : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={filter === "available"}
            className={filter === "available" ? styles.filterSelected : ""}
            onClick={() => setFilter("available")}
          >
            Available
          </button>
        </div>
        {visibleFaculty.length > 0
          ? <CardList items={visibleFaculty} />
          : <p className={styles.emptyState}>No faculty match your search.</p>}
      </div>
    </MobileLayout>
  );
}
