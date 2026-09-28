"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading, DetailList } from "@/app/mobile/_components/ui";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import {
  emptyAppointmentDraft,
  getAppointmentDraft,
  isAppointmentDraftComplete,
  saveAppointmentDraft,
  type AppointmentDraft,
} from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type SlotCheck =
  | { kind: "available"; meetingLocation: string | null }
  | { kind: "unavailable"; unavailable: "date" | "time" }
  | { kind: "error"; message: string };

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft>(emptyAppointmentDraft);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const loadDraft = window.setTimeout(() => setDraft(getAppointmentDraft()), 0);
    return () => window.clearTimeout(loadDraft);
  }, []);

  const details = useMemo(() => {
    const items = [
      { label: "Student Name", value: draft.studentName },
      { label: "Student ID", value: draft.studentId },
      { label: "Course and Year", value: draft.courseYear },
      { label: "Faculty Member", value: draft.facultyName },
      { label: "Preferred Date", value: draft.preferredDate },
      { label: "Preferred Time", value: draft.preferredTime },
      { label: "Meeting Location", value: draft.meetingLocation },
      { label: "Reason", value: draft.reason },
    ].filter((item) => item.value.trim());

    if (draft.details.trim()) items.push({ label: "Additional Details", value: draft.details });
    return items;
  }, [draft]);

  async function requestSubmission() {
    if (!isAppointmentDraftComplete(draft)) {
      router.replace("/student/calendar");
      return;
    }
    setError("");
    setCheckingAvailability(true);
    const slot = await findAvailableSlot(createClient(), draft);
    setCheckingAvailability(false);
    if (slot.kind === "error") {
      setError(slot.message);
      return;
    }
    if (slot.kind === "unavailable") {
      return handleUnavailableSlot(slot.unavailable);
    }
    setConfirming(true);
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      router.replace("/student/sign-in");
      return;
    }

    const { data: student, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, student_number, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (profileError || !student || student.role !== "student") {
      setSubmitting(false);
      return "Your student profile could not be found. Please sign in again.";
    }

    const slot = await findAvailableSlot(supabase, draft);
    if (slot.kind === "error") {
      setSubmitting(false);
      return slot.message;
    }
    if (slot.kind === "unavailable") {
      setSubmitting(false);
      handleUnavailableSlot(slot.unavailable);
      return;
    }

    const { data: submittedRequest, error: requestError } = await supabase
      .from("appointment_requests")
      .insert({
        student_profile_id: student.id,
        faculty_profile_id: draft.facultyId,
        student_name: student.full_name,
        student_number: student.student_number,
        faculty_name: draft.facultyName,
        preferred_date: draft.preferredDate,
        preferred_time: toDatabaseTime(draft.preferredTime),
        reason: draft.reason,
        details: draft.details,
        meeting_location: slot.meetingLocation,
      })
      .select("id, appointment_code")
      .single();
    setSubmitting(false);
    if (requestError?.code === "23505") {
      handleUnavailableSlot("time");
      return;
    }
    if (requestError || !submittedRequest) {
      return requestError?.message || "Your request could not be saved. Please try again.";
    }

    saveAppointmentDraft(emptyAppointmentDraft);
    router.replace("/student/request-submitted");
  }

  function handleUnavailableSlot(unavailable: "date" | "time") {
    const clearedDraft = unavailable === "date"
      ? { ...draft, preferredDate: "", preferredTime: "" }
      : { ...draft, preferredTime: "" };
    saveAppointmentDraft(clearedDraft);
    setConfirming(false);
    const facultyParams = `facultyId=${encodeURIComponent(draft.facultyId)}&facultyName=${encodeURIComponent(draft.facultyName)}`;
    router.replace(unavailable === "date" ? `/student/calendar?${facultyParams}&unavailable=true` : "/student/select-date-time?unavailable=true");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/appointment-info">
      <div className={styles.page}>
        <PageHeading title="Review Appointment" subtitle="Review the information you entered before submitting." />
        {details.length > 0
          ? <DetailList details={details} />
          : <p className={styles.emptyState}>No appointment information has been entered yet.</p>}
        {error && <Notice error>{error}</Notice>}
        <div className={styles.actions}>
          <Link className={styles.editButton} href="/student/appointment-info">Edit</Link>
          <button className={styles.submitButton} type="button" onClick={requestSubmission} disabled={!isAppointmentDraftComplete(draft) || submitting || checkingAvailability}>{checkingAvailability ? "Checking availability..." : submitting ? "Submitting..." : "Submit Request"}</button>
        </div>
      </div>
      <ConfirmationModal open={confirming} title="Submit consultation request?" description="Your request will be sent to the selected faculty member for review." confirmLabel="Submit Request" onCancel={() => setConfirming(false)} onConfirm={handleSubmit} />
    </MobileLayout>
  );
}

function toDatabaseTime(value: string) {
  const [time, period] = value.split(" ");
  const [hourText, minute] = time.split(":");
  let hour = Number(hourText);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}:00`;
}

async function findAvailableSlot(supabase: ReturnType<typeof createClient>, draft: AppointmentDraft): Promise<SlotCheck> {
  if (draft.preferredDate < localDateValue()) return { kind: "unavailable", unavailable: "date" };
  if (draft.preferredDate === localDateValue() && toMinutes(draft.preferredTime) <= currentMinutes()) {
    return { kind: "unavailable", unavailable: "time" };
  }

  const requestedTime = toDatabaseTime(draft.preferredTime);
  const [availabilityResult, bookedSlotsResult] = await Promise.all([
    supabase
      .from("faculty_availability")
      .select("start_time, end_time, meeting_location")
      .eq("faculty_profile_id", draft.facultyId)
      .eq("available_date", draft.preferredDate)
      .eq("is_available", true),
    supabase.rpc("get_reserved_appointment_slots", {
      requested_faculty_profile_id: draft.facultyId,
    }),
  ]);

  if (availabilityResult.error || bookedSlotsResult.error) {
    return { kind: "error", message: availabilityResult.error?.message || bookedSlotsResult.error?.message || "Availability could not be checked. Please try again." };
  }

  const availability = availabilityResult.data || [];
  if (!availability.length) return { kind: "unavailable", unavailable: "date" };
  const requestedMinutes = toMinutes(draft.preferredTime);
  const matchingSlot = availability.find((slot) => requestedMinutes >= databaseTimeToMinutes(slot.start_time) && requestedMinutes < databaseTimeToMinutes(slot.end_time));
  const booked = ((bookedSlotsResult.data || []) as { preferred_date: string; preferred_time: string }[])
    .some((slot) => slot.preferred_date === draft.preferredDate && slot.preferred_time.slice(0, 5) === requestedTime.slice(0, 5));
  if (!matchingSlot || booked) return { kind: "unavailable", unavailable: "time" };

  return { kind: "available", meetingLocation: matchingSlot.meeting_location || null };
}

function toMinutes(value: string) {
  const [clock, period] = value.split(" ");
  const [hourText, minuteText] = clock.split(":");
  let hour = Number(hourText);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + Number(minuteText);
}

function databaseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
