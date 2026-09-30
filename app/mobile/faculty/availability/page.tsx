"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthCalendar, MobileLayout, Notice, PageHeading } from "@/app/mobile/_components/ui";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import styles from "./page.module.css";

type Availability = { id: string; available_date: string; start_time: string; end_time: string; meeting_location: string | null };

export default function Page() {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [bookedOnRemovedDates, setBookedOnRemovedDates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const savedSelectedDates = useMemo(() => selectedDates.filter((date) => availability.some((slot) => slot.available_date === date)), [availability, selectedDates]);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/faculty/sign-in"); return; }
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (!profile || profile.role !== "faculty") { router.replace("/faculty/sign-in"); return; }
      const { data, error: availabilityError } = await supabase.from("faculty_availability").select("id, available_date, start_time, end_time, meeting_location").eq("faculty_profile_id", profile.id).eq("is_available", true).not("available_date", "is", null).order("available_date");
      if (!active) return;
      setFacultyId(profile.id);
      if (availabilityError) setError(availabilityError.message);
      else setAvailability((data || []) as Availability[]);
      setIsLoading(false);
    }
    void loadAvailability();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  function selectDate(date: string) {
    setError("");
    setSavedCount(0);
    setSelectedDates((current) => current.includes(date) ? current.filter((value) => value !== date) : [...current, date].sort());
  }

  async function saveAvailability() {
    if (!facultyId || !selectedDates.length) { setError("Select one or more dates on the calendar first."); return; }
    if (!meetingLocation.trim()) { setError("Add a meeting room or location so students know where to go."); return; }
    if (endTime <= startTime) { setError("End time must be after start time."); return; }
    setError("");
    setSaving(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("faculty_availability").delete().eq("faculty_profile_id", facultyId).in("available_date", selectedDates);
    if (deleteError) { setSaving(false); setError(deleteError.message); return; }
    const { data, error: insertError } = await supabase.from("faculty_availability").insert(selectedDates.map((availableDate) => ({ faculty_profile_id: facultyId, available_date: availableDate, start_time: startTime, end_time: endTime, meeting_location: meetingLocation.trim() || null, is_available: true }))).select("id, available_date, start_time, end_time, meeting_location");
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setAvailability((current) => [...current.filter((slot) => !selectedDates.includes(slot.available_date)), ...((data || []) as Availability[])].sort((a, b) => a.available_date.localeCompare(b.available_date)));
    setSavedCount(selectedDates.length);
    setSelectedDates([]);
  }

  async function startRemoval() {
    const { count } = await createClient()
      .from("appointment_requests")
      .select("id", { count: "exact", head: true })
      .eq("faculty_profile_id", facultyId)
      .in("preferred_date", savedSelectedDates)
      .in("status", ["pending", "confirmed"]);
    setBookedOnRemovedDates(count || 0);
    setConfirmingRemoval(true);
  }

  async function removeAvailability() {
    if (!facultyId || !savedSelectedDates.length) return;
    setError("");
    setSaving(true);
    const { error: deleteError } = await createClient().from("faculty_availability").delete().eq("faculty_profile_id", facultyId).in("available_date", savedSelectedDates);
    setSaving(false);
    if (deleteError) return deleteError.message;
    setAvailability((current) => current.filter((slot) => !savedSelectedDates.includes(slot.available_date)));
    setSavedCount(0);
    setSelectedDates([]);
  }

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/calendar" role="faculty" activeNav="calendar">
      <div className={styles.page}>
        <PageHeading title="Availability" subtitle="Choose specific dates and times students can request." />
        <MonthCalendar month={month} selectedDates={selectedDates} markedDates={availability.map((slot) => slot.available_date)} legend="Outlined dates are available to students" onSelectDate={selectDate} onMonthChange={setMonth} />
        <section className={styles.editor} aria-label="Selected date availability">
          <p className={styles.selectedDate}>{selectedDates.length ? `${selectedDates.length} ${selectedDates.length === 1 ? "date" : "dates"} selected` : "Select one or more dates from the calendar"}</p>
          <div className={styles.times}>
            <label>Start time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={!selectedDates.length} /></label>
            <label>End time<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={!selectedDates.length} /></label>
          </div>
          <label className={styles.location}>Meeting room or location <span className={styles.required}>(required)</span><input required value={meetingLocation} onChange={(event) => setMeetingLocation(event.target.value)} placeholder="e.g. Faculty Office, Room 21" disabled={!selectedDates.length} /></label>
          {savedSelectedDates.length > 0 && <button className={styles.removeButton} type="button" onClick={startRemoval} disabled={saving}>Make {savedSelectedDates.length === 1 ? "selected date" : "selected dates"} unavailable</button>}
        </section>
        {error && <Notice error>{error}</Notice>}
        {savedCount > 0 && <Notice>{savedCount} {savedCount === 1 ? "date has" : "dates have"} been saved.</Notice>}
        <div className={styles.saveArea}>
          <button className={styles.saveButton} type="button" onClick={savedCount > 0 ? () => router.push("/faculty/calendar") : saveAvailability} disabled={saving || (!selectedDates.length && savedCount === 0)}>
            {saving ? "Saving..." : savedCount > 0 ? "View Calendar" : "Save Selected Dates"}
          </button>
        </div>
      </div>
      <ConfirmationModal open={confirmingRemoval} title="Remove availability?" description={`The selected ${savedSelectedDates.length === 1 ? "date will" : "dates will"} no longer be available for students to request.${bookedOnRemovedDates ? ` ${bookedOnRemovedDates} ${bookedOnRemovedDates === 1 ? "consultation is" : "consultations are"} already booked on ${savedSelectedDates.length === 1 ? "this date" : "these dates"} and will stay booked. Cancel or decline them from Requests if you can't attend.` : ""}`} confirmLabel="Remove Dates" tone="danger" onCancel={() => setConfirmingRemoval(false)} onConfirm={removeAvailability} />
    </MobileLayout>
  );
}
