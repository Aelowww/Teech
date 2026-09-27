"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthCalendar, MobileLayout, Notice, PageHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type Availability = { id: string; available_date: string; start_time: string; end_time: string };

export default function Page() {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const savedSelectedDates = useMemo(() => selectedDates.filter((date) => availability.some((slot) => slot.available_date === date)), [availability, selectedDates]);

  useEffect(() => {
    let active = true;
    async function loadAvailability() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/teacher/sign-in"); return; }
      const { data: profile } = await supabase.from("profiles").select("id, role").eq("auth_user_id", user.id).maybeSingle();
      if (!profile || profile.role !== "faculty") { router.replace("/teacher/sign-in"); return; }
      const { data, error: availabilityError } = await supabase.from("faculty_availability").select("id, available_date, start_time, end_time").eq("faculty_profile_id", profile.id).eq("is_available", true).not("available_date", "is", null).order("available_date");
      if (!active) return;
      setFacultyId(profile.id);
      if (availabilityError) setError(availabilityError.message);
      else setAvailability((data || []) as Availability[]);
    }
    void loadAvailability();
    return () => { active = false; };
  }, [router]);

  function selectDate(date: string) {
    setError("");
    setSavedCount(0);
    setSelectedDates((current) => current.includes(date) ? current.filter((value) => value !== date) : [...current, date].sort());
  }

  async function saveAvailability() {
    if (!facultyId || !selectedDates.length) { setError("Select one or more dates on the calendar first."); return; }
    if (endTime <= startTime) { setError("End time must be after start time."); return; }
    setError("");
    setSaving(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("faculty_availability").delete().eq("faculty_profile_id", facultyId).in("available_date", selectedDates);
    if (deleteError) { setSaving(false); setError(deleteError.message); return; }
    const { data, error: insertError } = await supabase.from("faculty_availability").insert(selectedDates.map((availableDate) => ({ faculty_profile_id: facultyId, available_date: availableDate, start_time: startTime, end_time: endTime, is_available: true }))).select("id, available_date, start_time, end_time");
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    setAvailability((current) => [...current.filter((slot) => !selectedDates.includes(slot.available_date)), ...((data || []) as Availability[])].sort((a, b) => a.available_date.localeCompare(b.available_date)));
    setSavedCount(selectedDates.length);
    setSelectedDates([]);
  }

  async function removeAvailability() {
    if (!facultyId || !savedSelectedDates.length) return;
    const label = savedSelectedDates.length === 1 ? "this date" : `these ${savedSelectedDates.length} dates`;
    if (!window.confirm(`Make ${label} unavailable to students?`)) return;
    setError("");
    setSaving(true);
    const { error: deleteError } = await createClient().from("faculty_availability").delete().eq("faculty_profile_id", facultyId).in("available_date", savedSelectedDates);
    setSaving(false);
    if (deleteError) { setError(deleteError.message); return; }
    setAvailability((current) => current.filter((slot) => !savedSelectedDates.includes(slot.available_date)));
    setSavedCount(0);
    setSelectedDates([]);
  }

  return (
    <MobileLayout className={styles.screen} backTo="/teacher/calendar" role="teacher" activeNav="calendar">
      <div className={styles.page}>
        <PageHeading title="Availability" subtitle="Choose specific dates and times students can request." />
        <MonthCalendar month={month} selectedDates={selectedDates} markedDates={availability.map((slot) => slot.available_date)} legend="Outlined dates are available to students" onSelectDate={selectDate} onMonthChange={setMonth} />
        <section className={styles.editor} aria-label="Selected date availability">
          <p className={styles.selectedDate}>{selectedDates.length ? `${selectedDates.length} ${selectedDates.length === 1 ? "date" : "dates"} selected` : "Select one or more dates from the calendar"}</p>
          <div className={styles.times}>
            <label>Start time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={!selectedDates.length} /></label>
            <label>End time<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={!selectedDates.length} /></label>
          </div>
          {savedSelectedDates.length > 0 && <button className={styles.removeButton} type="button" onClick={removeAvailability} disabled={saving}>Make {savedSelectedDates.length === 1 ? "selected date" : "selected dates"} unavailable</button>}
        </section>
        {error && <Notice error>{error}</Notice>}
        {savedCount > 0 && <Notice>{savedCount} {savedCount === 1 ? "date has" : "dates have"} been saved.</Notice>}
        <div className={styles.saveArea}>
          <button className={styles.saveButton} type="button" onClick={savedCount > 0 ? () => router.push("/teacher/calendar") : saveAvailability} disabled={saving || (!selectedDates.length && savedCount === 0)}>
            {saving ? "Saving..." : savedCount > 0 ? "View Calendar" : "Save Selected Dates"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
