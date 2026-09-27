"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { MobileLayout, Notice, PageHeading, MonthCalendar } from "@/components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/components/app-loader";
import styles from "./page.module.css";

const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
type Availability = { available_date: string; start_time: string; end_time: string; meeting_location: string | null };
type ReservedSlot = { preferred_date: string; preferred_time: string };

export default function Page() {
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [locationsByDate, setLocationsByDate] = useState<Record<string, string>>({});
  const [facultyLocations, setFacultyLocations] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
      if (!updatedDraft.facultyId) {
        setIsLoading(false);
        return;
      }
      const supabase = createClient();
      const [availabilityResult, reservedSlotsResult] = await Promise.all([
        supabase
          .from("faculty_availability")
          .select("available_date, start_time, end_time, meeting_location")
          .eq("faculty_profile_id", updatedDraft.facultyId)
          .eq("is_available", true)
          .not("available_date", "is", null)
          .gte("available_date", localDateValue()),
        supabase.rpc("get_reserved_appointment_slots", { requested_faculty_profile_id: updatedDraft.facultyId }),
      ]);
      if (!active) return;
      if (availabilityResult.error || reservedSlotsResult.error) {
        setError(availabilityResult.error?.message || reservedSlotsResult.error?.message || "Available dates could not be loaded.");
      } else {
        const availability = (availabilityResult.data || []) as Availability[];
        const reservedSlots = (reservedSlotsResult.data || []) as ReservedSlot[];
        const dates = getBookableDates(availability, reservedSlots);
        const locations = availability.reduce<Record<string, string>>((current, slot) => {
          if (!current[slot.available_date] && slot.meeting_location) current[slot.available_date] = slot.meeting_location;
          return current;
        }, {});
        setAvailableDates(dates);
        setLocationsByDate(locations);
        setFacultyLocations([...new Set(Object.values(locations))]);
        if (updatedDraft.preferredDate && !dates.includes(updatedDraft.preferredDate)) {
          const clearedDraft = { ...updatedDraft, preferredDate: "", preferredTime: "", meetingLocation: "" };
          setDraft(clearedDraft);
          saveAppointmentDraft(clearedDraft);
        }
      }
      setIsLoading(false);
    }, 0);
    return () => { active = false; window.clearTimeout(loadDraft); };
  }, []);

  if (isLoading) return <AppLoader />;

  function selectDate(preferredDate: string) {
    if (!availableDates.includes(preferredDate)) return;
    const currentDraft = draft || getAppointmentDraft();
    const updatedDraft = {
      ...currentDraft,
      preferredDate,
      preferredTime: currentDraft.preferredDate === preferredDate ? currentDraft.preferredTime : "",
      meetingLocation: locationsByDate[preferredDate] || "",
    };
    setDraft(updatedDraft);
    saveAppointmentDraft(updatedDraft);
  }

  function continueToTimes() {
    if (!draft?.facultyId || !draft.preferredDate || !availableDates.includes(draft.preferredDate)) return;
    router.push("/student/select-date-time");
  }

  const meetingLocation = draft?.preferredDate && locationsByDate[draft.preferredDate]
    ? locationsByDate[draft.preferredDate]
    : facultyLocations.length === 1 ? facultyLocations[0] : "";

  return (
    <MobileLayout className={styles.screen} backTo="/student/home" role="student" activeNav="faculty">
      <div className={styles.page}>
        <PageHeading
          title={month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          subtitle={draft?.facultyName ? `Choose one of ${draft.facultyName}'s available dates.` : "Select a faculty member before choosing a date."}
        />
        <MonthCalendar month={month} selectedDate={draft?.preferredDate} availableDates={availableDates} legend="Available dates" onSelectDate={draft?.facultyId ? selectDate : undefined} onMonthChange={setMonth} />
        {error && <Notice error>{error}</Notice>}
        {meetingLocation && (
          <aside className={styles.locationCard}>
            <span className={styles.locationIcon}><MapPin size={16} /></span>
            <div className={styles.locationCopy}>
              <span className={styles.locationLabel}>Meeting location</span>
              <strong className={styles.locationValue}>{meetingLocation}</strong>
            </div>
          </aside>
        )}
        {draft?.facultyId && !error && availableDates.length === 0 && <p className={styles.emptyState}>This faculty member has not published any upcoming dates.</p>}
        <button className={styles.continueButton} type="button" onClick={continueToTimes} disabled={!draft?.facultyId || !draft.preferredDate || !availableDates.includes(draft.preferredDate)}>Continue</button>
      </div>
    </MobileLayout>
  );
}

function getBookableDates(availability: Availability[], reservedSlots: ReservedSlot[]) {
  return [...new Set(availability.map((slot) => slot.available_date))].filter((date) => {
    const dateSlots = timeSlots.filter((time) => availability.some((slot) => slot.available_date === date && isWithinAvailability(time, slot.start_time, slot.end_time)));
    return dateSlots.some((time) => !reservedSlots.some((reserved) => reserved.preferred_date === date && reserved.preferred_time.slice(0, 5) === toDatabaseTime(time)));
  });
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

function toDatabaseTime(value: string) {
  const [clock, period] = value.split(" ");
  const [hourText, minute] = clock.split(":");
  let hour = Number(hourText);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
