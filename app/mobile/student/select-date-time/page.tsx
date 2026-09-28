"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { MobileLayout, Notice, PageHeading, AvailabilitySlots } from "@/app/mobile/_components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import styles from "./page.module.css";

const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const [locationsByTime, setLocationsByTime] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [unavailableNotice, setUnavailableNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      setUnavailableNotice(new URLSearchParams(window.location.search).get("unavailable") === "true");
      const storedDraft = getAppointmentDraft();
      if (!active) return;
      setDraft(storedDraft);
      if (!storedDraft.facultyId || !storedDraft.preferredDate) {
        setIsLoading(false);
        return;
      }
      const supabase = createClient();
      const [availabilityResult, bookedSlotsResult] = await Promise.all([
        supabase
          .from("faculty_availability")
          .select("start_time, end_time, meeting_location")
          .eq("faculty_profile_id", storedDraft.facultyId)
          .eq("available_date", storedDraft.preferredDate)
          .eq("is_available", true),
        supabase.rpc("get_reserved_appointment_slots", {
          requested_faculty_profile_id: storedDraft.facultyId,
        }),
      ]);
      if (!active) return;
      if (availabilityResult.error || bookedSlotsResult.error) {
        setError(availabilityResult.error?.message || bookedSlotsResult.error?.message || "Available times could not be loaded.");
        setIsLoading(false);
        return;
      }
      const bookedTimes = new Set(
        ((bookedSlotsResult.data || []) as { preferred_date: string; preferred_time: string }[])
          .filter((slot) => slot.preferred_date === storedDraft.preferredDate)
          .map((slot) => slot.preferred_time.slice(0, 5)),
      );
      const times = timeSlots.filter((time) =>
        availabilityResult.data?.some((slot) => isWithinAvailability(time, slot.start_time, slot.end_time))
        && !isPastTimeToday(storedDraft.preferredDate, time),
      );
      const unavailable = times.filter((time) => bookedTimes.has(toDatabaseTime(time)));
      const locations = times.reduce<Record<string, string>>((current, time) => {
        const matchingAvailability = availabilityResult.data?.find((slot) => isWithinAvailability(time, slot.start_time, slot.end_time));
        if (matchingAvailability?.meeting_location) current[time] = matchingAvailability.meeting_location;
        return current;
      }, {});
      setAvailableTimes(times);
      setUnavailableTimes(unavailable);
      setLocationsByTime(locations);
      if (times.length === 0) {
        const clearedDraft = { ...storedDraft, preferredDate: "", preferredTime: "" };
        saveAppointmentDraft(clearedDraft);
        router.replace(`/student/calendar?facultyId=${encodeURIComponent(storedDraft.facultyId)}&facultyName=${encodeURIComponent(storedDraft.facultyName)}&unavailable=true`);
        return;
      }
      if (storedDraft.preferredTime && (!times.includes(storedDraft.preferredTime) || unavailable.includes(storedDraft.preferredTime))) {
        const updatedDraft = { ...storedDraft, preferredTime: "" };
        setDraft(updatedDraft);
        saveAppointmentDraft(updatedDraft);
      }
      setIsLoading(false);
    }
    void loadAvailability();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  function selectTime(preferredTime: string) {
    const updatedDraft = { ...(draft || getAppointmentDraft()), preferredTime, meetingLocation: locationsByTime[preferredTime] || "" };
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
        {unavailableNotice && <Notice error>This time is no longer available. Please choose another time.</Notice>}
        {!error && availableTimes.length > 0 && availableTimes.every((time) => unavailableTimes.includes(time)) && <Notice>This date is fully booked. Choose another available date.</Notice>}
        {draft?.facultyId && draft.preferredDate && !error && availableTimes.length === 0
          ? <p className={styles.emptyState}>This faculty member has no availability on the selected date.</p>
          : <AvailabilitySlots times={availableTimes} unavailableTimes={unavailableTimes} selectedTime={draft?.preferredTime} onSelectTime={selectTime} disabled={!draft?.facultyId || !draft?.preferredDate} />}
        {draft?.preferredDate && <div className={styles.selectionSummary}>
          <CalendarDays size={16} />
          <div><span>Selected date</span><strong>{selectedDate}</strong></div>
          {draft.preferredTime && <><Clock3 size={16} /><div><span>Selected time</span><strong>{draft.preferredTime}</strong></div></>}
          {draft.meetingLocation && <><MapPin size={16} /><div><span>Meeting location</span><strong>{draft.meetingLocation}</strong></div></>}
        </div>}
        <button className={styles.continueButton} type="button" onClick={continueToInformation} disabled={!draft?.facultyId || !draft?.preferredDate || !draft.preferredTime}>Continue</button>
      </div>
    </MobileLayout>
  );
}

function isWithinAvailability(time: string, startTime: string, endTime: string) {
  const candidate = toMinutes(time);
  return candidate >= toMinutes(startTime) && candidate < toMinutes(endTime);
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

function isPastTimeToday(date: string, time: string) {
  if (date !== localDateValue()) return false;
  const now = new Date();
  return toMinutes(time) <= now.getHours() * 60 + now.getMinutes();
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
