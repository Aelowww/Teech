"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { DesktopLayout, MonthCalendar, Notice, PageHeading } from "@/app/desktop/_components/ui";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import styles from "./page.module.css";

type Availability = { id: string; available_date: string; start_time: string; end_time: string };

export default function Page() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCalendar() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (!profile || profile.role !== "faculty") { router.replace("/faculty/sign-in"); return; }
      const { data, error: availabilityError } = await supabase.from("faculty_availability").select("id, available_date, start_time, end_time").eq("faculty_profile_id", profile.id).eq("is_available", true).not("available_date", "is", null).order("available_date");
      if (!active) return;
      if (availabilityError) setError(availabilityError.message);
      else setAvailability((data || []) as Availability[]);
      setIsLoading(false);
    }
    void loadCalendar();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcomingCount = new Set(availability.filter((slot) => slot.available_date >= todayValue).map((slot) => slot.available_date)).size;

  return (
    <DesktopLayout className={styles.screen} role="faculty" activeNav="calendar">
      <PageHeading title="Calendar" subtitle="Your published consultation dates." />
      <div className={styles.page}>
        <MonthCalendar soft month={month} markedDates={availability.map((slot) => slot.available_date)} legend="Published" onMonthChange={setMonth} />
        <aside className={styles.side}>
          {error && <Notice error>{error}</Notice>}
          <section className={styles.summary}>
            <span className={styles.summaryIcon}><CalendarDays size={22} /></span>
            <div className={styles.summaryText}>
              <strong>{upcomingCount} upcoming {upcomingCount === 1 ? "date" : "dates"}</strong>
              <p>{upcomingCount ? "Students can request these dates." : "Publish dates so students can book you."}</p>
            </div>
          </section>
          <Link className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block}`} href="/faculty/availability">Manage availability<ChevronRight size={15} /></Link>
        </aside>
      </div>
    </DesktopLayout>
  );
}
