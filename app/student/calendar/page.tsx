"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading, MonthCalendar } from "@/components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadDraft = window.setTimeout(async () => {
      const storedDraft = getAppointmentDraft();
      const params = new URLSearchParams(window.location.search);
      const facultyId = params.get("facultyId");
      const facultyName = params.get("facultyName");
      const updatedDraft = facultyId && facultyName ? { ...storedDraft, facultyId, facultyName } : storedDraft;

      setDraft(updatedDraft);
      if (facultyId && facultyName) saveAppointmentDraft(updatedDraft);
      if (!updatedDraft.facultyId) return;
      const { data, error: availabilityError } = await createClient()
        .from("faculty_availability")
        .select("available_date")
        .eq("faculty_profile_id", updatedDraft.facultyId)
        .eq("is_available", true)
        .not("available_date", "is", null)
        .gte("available_date", new Date().toISOString().slice(0, 10));
      if (!active) return;
      if (availabilityError) setError(availabilityError.message);
      else setAvailableDates((data || []).map((slot) => slot.available_date));
    }, 0);
    return () => { active = false; window.clearTimeout(loadDraft); };
  }, []);

  function selectDate(preferredDate: string) {
    const currentDraft = draft || getAppointmentDraft();
    const updatedDraft = {
      ...currentDraft,
      preferredDate,
      preferredTime: currentDraft.preferredDate === preferredDate ? currentDraft.preferredTime : "",
    };
    setDraft(updatedDraft);
    saveAppointmentDraft(updatedDraft);
  }

  function continueToTimes() {
    if (!draft?.facultyId || !draft.preferredDate) return;
    router.push("/student/select-date-time");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="faculty">
      <div className={styles.page}>
        <PageHeading
          title={month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          subtitle={draft?.facultyName ? `Choose one of ${draft.facultyName}'s available dates.` : "Select a faculty member before choosing a date."}
        />
        <MonthCalendar month={month} selectedDate={draft?.preferredDate} availableDates={availableDates} legend="Available dates" onSelectDate={draft?.facultyId ? selectDate : undefined} onMonthChange={setMonth} />
        {error && <Notice error>{error}</Notice>}
        {draft?.facultyId && !error && availableDates.length === 0 && <p className={styles.emptyState}>This faculty member has not published any upcoming dates.</p>}
        <button className={styles.continueButton} type="button" onClick={continueToTimes} disabled={!draft?.facultyId || !draft.preferredDate}>Continue</button>
      </div>
    </MobileLayout>
  );
}
