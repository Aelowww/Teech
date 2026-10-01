"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
<<<<<<< HEAD
import { DesktopLayout, Notice, PageHeading, AvailabilitySlots } from "@/app/desktop/_components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { slotsFor } from "@/lib/time-slots";
=======
import { DesktopLayout, EmptyState, Notice, PageHeading, AvailabilitySlots } from "@/app/desktop/_components/ui";
import { getAppointmentDraft, saveAppointmentDraft, type AppointmentDraft } from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { isBlockedWhileBusy, slotsFor } from "@/lib/time-slots";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import { BookingSteps } from "@/app/desktop/_components/booking-steps";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import booking from "@/app/desktop/_components/booking.module.css";
import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const [locationsByTime, setLocationsByTime] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [unavailableNotice, setUnavailableNotice] = useState(false);
<<<<<<< HEAD
=======
  const [busyHours, setBusyHours] = useState<string[]>([]);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
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
<<<<<<< HEAD
      const [availabilityResult, bookedSlotsResult] = await Promise.all([
=======
      const [availabilityResult, bookedSlotsResult, presenceResult] = await Promise.all([
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
        supabase
          .from("faculty_availability")
          .select("start_time, end_time, meeting_location")
          .eq("faculty_profile_id", storedDraft.facultyId)
          .eq("available_date", storedDraft.preferredDate)
          .eq("is_available", true),
        supabase.rpc("get_reserved_appointment_slots", {
          requested_faculty_profile_id: storedDraft.facultyId,
        }),
<<<<<<< HEAD
=======
        supabase.from("profiles").select("presence_status").eq("id", storedDraft.facultyId).maybeSingle(),
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
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
      const times = slotsFor(availabilityResult.data || []).filter((time) => !isPastTimeToday(storedDraft.preferredDate, time));
<<<<<<< HEAD
      const unavailable = times.filter((time) => bookedTimes.has(toDatabaseTime(time)));
=======
      const busy = times.filter((time) => isBlockedWhileBusy(storedDraft.preferredDate, time, presenceResult.data?.presence_status));
      const unavailable = times.filter((time) => bookedTimes.has(toDatabaseTime(time)) || busy.includes(time));
      setBusyHours(busy);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
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
    <DesktopLayout className={styles.screen} backTo="/student/calendar" role="student" activeNav="faculty">
      <BookingSteps current={2} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading title="Choose a time" subtitle={selectedDate} />
          {error && <Notice error>{error}</Notice>}
          {unavailableNotice && <Notice error>This time is no longer available. Please choose another time.</Notice>}
<<<<<<< HEAD
          {!error && availableTimes.length > 0 && availableTimes.every((time) => unavailableTimes.includes(time)) && <Notice>This date is fully booked. Choose another available date.</Notice>}
          {draft?.facultyId && draft.preferredDate && !error && availableTimes.length === 0
            ? <p className={styles.emptyState}>This faculty member has no availability on the selected date.</p>
=======
          {!error && busyHours.length > 0 && <Notice>{draft?.facultyName || "This faculty member"} is busy right now, so {busyHours.length === 1 ? busyHours[0] : "the next hour"} can’t be booked. Other times are open.</Notice>}
          {!error && availableTimes.length > 0 && availableTimes.every((time) => unavailableTimes.includes(time)) && <Notice>This date is fully booked. Choose another available date.</Notice>}
          {draft?.facultyId && draft.preferredDate && !error && availableTimes.length === 0
            ? <EmptyState compact scene="calendar" title="This faculty member has no availability on the selected date." action={{ label: "Pick another date", href: "/student/calendar" }} />
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
            : <AvailabilitySlots times={availableTimes} unavailableTimes={unavailableTimes} selectedTime={draft?.preferredTime} onSelectTime={selectTime} disabled={!draft?.facultyId || !draft?.preferredDate} />}
        </section>

        <aside className={booking.side}>
          <h2>Your consultation</h2>
          <dl className={booking.summaryList}>
            <div><UserRound size={18} /><dt>Faculty</dt><dd>{draft?.facultyName || <span className={booking.placeholder}>Not selected</span>}</dd></div>
            <div><CalendarDays size={18} /><dt>Date</dt><dd>{draft?.preferredDate ? selectedDate : <span className={booking.placeholder}>Pick a date</span>}</dd></div>
            <div><Clock3 size={18} /><dt>Time</dt><dd>{draft?.preferredTime || <span className={booking.placeholder}>Pick a time</span>}</dd></div>
            {draft?.meetingLocation && <div><MapPin size={18} /><dt>Meeting location</dt><dd>{draft.meetingLocation}</dd></div>}
          </dl>
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block} ${booking.continueButton}`} type="button" onClick={continueToInformation} disabled={!draft?.facultyId || !draft?.preferredDate || !draft.preferredTime}>Continue<ArrowRight size={17} /></button>
        </aside>
      </div>
    </DesktopLayout>
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
