"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3 } from "lucide-react";
import { MobileLayout, Notice, PageHeading, AvailabilitySlots } from "@/components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/components/app-loader";
import styles from "./page.module.css";

const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      const storedDraft = getAppointmentDraft();
      if (!active) return;
      setDraft(storedDraft);
      if (!storedDraft.facultyId || !storedDraft.preferredDate) {
        setIsLoading(false);
        return;
      }
      const { data, error: availabilityError } = await createClient()
        .from("faculty_availability")
        .select("start_time, end_time")
        .eq("faculty_profile_id", storedDraft.facultyId)
        .eq("available_date", storedDraft.preferredDate)
        .eq("is_available", true);
      if (!active) return;
      if (availabilityError) {
        setError(availabilityError.message);
        setIsLoading(false);
        return;
      }
      const times = timeSlots.filter((time) => data?.some((slot) => isWithinAvailability(time, slot.start_time, slot.end_time)));
      setAvailableTimes(times);
      if (storedDraft.preferredTime && !times.includes(storedDraft.preferredTime)) {
        const updatedDraft = { ...storedDraft, preferredTime: "" };
        setDraft(updatedDraft);
        saveAppointmentDraft(updatedDraft);
      }
      setIsLoading(false);
    }
    void loadAvailability();
    return () => { active = false; };
  }, []);

  if (isLoading) return <AppLoader />;

  function selectTime(preferredTime: string) {
    const updatedDraft = { ...(draft || getAppointmentDraft()), preferredTime };
    setDraft(updatedDraft);
    saveAppointmentDraft(updatedDraft);
  }

  function continueToInformation() {
    if (!draft?.facultyId || !draft.preferredDate || !draft.preferredTime) return;
    router.push("/student/appointment-info");
  }

  const selectedDate = draft?.preferredDate
    ? new Date(`${draft.preferredDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Choose a date on the calendar first.";

  return (
    <MobileLayout className={styles.screen} backTo="/student/calendar">
      <div className={styles.page}>
        <PageHeading title="Choose a time" subtitle={selectedDate} />
        {error && <Notice error>{error}</Notice>}
        {draft?.facultyId && draft.preferredDate && !error && availableTimes.length === 0
          ? <p className={styles.emptyState}>This faculty member has no availability on the selected date.</p>
          : <AvailabilitySlots times={availableTimes} selectedTime={draft?.preferredTime} onSelectTime={selectTime} disabled={!draft?.facultyId || !draft?.preferredDate} />}
        {draft?.preferredDate && <div className={styles.selectionSummary}>
          <CalendarDays size={16} />
          <div><span>Selected date</span><strong>{selectedDate}</strong></div>
          {draft.preferredTime && <><Clock3 size={16} /><div><span>Selected time</span><strong>{draft.preferredTime}</strong></div></>}
        </div>}
        <button className={styles.continueButton} type="button" onClick={continueToInformation} disabled={!draft?.facultyId || !draft?.preferredDate || !draft.preferredTime}>Continue</button>
      </div>
    </MobileLayout>
  );
}

function isWithinAvailability(time: string, startTime: string, endTime: string) {
  const candidate = toMinutes(time);
  return candidate >= toMinutes(startTime) && candidate <= toMinutes(endTime);
}

function toMinutes(value: string) {
  if (value.includes("AM") || value.includes("PM")) {
    const [clock, period] = value.split(" ");
    const [hours, minutes] = clock.split(":").map(Number);
    const normalizedHours = period === "PM" && hours !== 12 ? hours + 12 : period === "AM" && hours === 12 ? 0 : hours;
    return normalizedHours * 60 + minutes;
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
