"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
<<<<<<< HEAD
import { DesktopLayout, Notice, PageHeading, MonthCalendar } from "@/app/desktop/_components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { isPastSlotToday, slotsFor } from "@/lib/time-slots";
=======
import { DesktopLayout, EmptyState, Notice, PageHeading, MonthCalendar } from "@/app/desktop/_components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { isBlockedWhileBusy, isPastSlotToday, slotsFor } from "@/lib/time-slots";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import { BookingSteps } from "@/app/desktop/_components/booking-steps";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import booking from "@/app/desktop/_components/booking.module.css";
import styles from "./page.module.css";

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
<<<<<<< HEAD
      const [availabilityResult, reservedSlotsResult] = await Promise.all([
=======
      const [availabilityResult, reservedSlotsResult, presenceResult] = await Promise.all([
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
        supabase
          .from("faculty_availability")
          .select("available_date, start_time, end_time, meeting_location")
          .eq("faculty_profile_id", updatedDraft.facultyId)
          .eq("is_available", true)
          .not("available_date", "is", null)
          .gte("available_date", localDateValue()),
        supabase.rpc("get_reserved_appointment_slots", { requested_faculty_profile_id: updatedDraft.facultyId }),
<<<<<<< HEAD
=======
        supabase.from("profiles").select("presence_status").eq("id", updatedDraft.facultyId).maybeSingle(),
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
      ]);
      if (!active) return;
      if (availabilityResult.error || reservedSlotsResult.error) {
        setError(availabilityResult.error?.message || reservedSlotsResult.error?.message || "Available dates could not be loaded.");
      } else {
        const availability = (availabilityResult.data || []) as Availability[];
        const reservedSlots = (reservedSlotsResult.data || []) as ReservedSlot[];
<<<<<<< HEAD
        const dates = getBookableDates(availability, reservedSlots);
=======
        const dates = getBookableDates(availability, reservedSlots, presenceResult.data?.presence_status);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
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
    <DesktopLayout className={styles.screen} backTo="/student/faculty" role="student" activeNav="faculty">
      <BookingSteps current={1} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading
            title="Choose a date"
            subtitle={draft?.facultyName ? `Pick one of ${draft.facultyName}'s available dates.` : "Select a faculty member before choosing a date."}
          />
          <MonthCalendar month={month} selectedDate={draft?.preferredDate} availableDates={availableDates} legend="Available dates" onSelectDate={draft?.facultyId ? selectDate : undefined} onMonthChange={setMonth} />
        </section>

        <aside className={booking.side}>
          <h2>Your consultation</h2>
          <dl className={booking.summaryList}>
            <div><UserRound size={18} /><dt>Faculty</dt><dd>{draft?.facultyName || <span className={booking.placeholder}>Not selected</span>}</dd></div>
            <div><CalendarDays size={18} /><dt>Date</dt><dd>{draft?.preferredDate ? formatLongDate(draft.preferredDate) : <span className={booking.placeholder}>Pick a date</span>}</dd></div>
            {meetingLocation && <div><MapPin size={18} /><dt>Meeting location</dt><dd>{meetingLocation}</dd></div>}
          </dl>
          {error && <Notice error>{error}</Notice>}
<<<<<<< HEAD
          {draft?.facultyId && !error && availableDates.length === 0 && <p className={booking.hint}>This faculty member has not published any upcoming dates.</p>}
=======
          {draft?.facultyId && !error && availableDates.length === 0 && <EmptyState compact scene="calendar" title="This faculty member has not published any upcoming dates." action={{ label: "Choose another faculty", href: "/student/faculty" }} />}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block} ${booking.continueButton}`} type="button" onClick={continueToTimes} disabled={!draft?.facultyId || !draft.preferredDate || !availableDates.includes(draft.preferredDate)}>Continue<ArrowRight size={17} /></button>
        </aside>
      </div>
    </DesktopLayout>
  );
}

<<<<<<< HEAD
function getBookableDates(availability: Availability[], reservedSlots: ReservedSlot[]) {
  return [...new Set(availability.map((slot) => slot.available_date))].filter((date) => {
    const dateSlots = slotsFor(availability.filter((slot) => slot.available_date === date)).filter((time) => !isPastSlotToday(date, time));
=======
function getBookableDates(availability: Availability[], reservedSlots: ReservedSlot[], presence: string | null | undefined) {
  return [...new Set(availability.map((slot) => slot.available_date))].filter((date) => {
    const dateSlots = slotsFor(availability.filter((slot) => slot.available_date === date)).filter((time) => !isPastSlotToday(date, time) && !isBlockedWhileBusy(date, time, presence));
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    return dateSlots.some((time) => !reservedSlots.some((reserved) => reserved.preferred_date === date && reserved.preferred_time.slice(0, 5) === toDatabaseTime(time)));
  });
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

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
