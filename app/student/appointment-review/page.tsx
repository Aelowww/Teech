"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, Notice, PageHeading, DetailList } from "@/components/ui";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  emptyAppointmentDraft,
  getAppointmentDraft,
  isAppointmentDraftComplete,
  saveAppointmentDraft,
  type AppointmentDraft,
} from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft>(emptyAppointmentDraft);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      { label: "Reason", value: draft.reason },
    ].filter((item) => item.value.trim());

    if (draft.details.trim()) items.push({ label: "Additional Details", value: draft.details });
    return items;
  }, [draft]);

  function requestSubmission() {
    if (!isAppointmentDraftComplete(draft)) {
      router.replace("/student/calendar");
      return;
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
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (requestError || !submittedRequest) {
      return requestError?.message || "Your request could not be saved. Please try again.";
    }

    saveAppointmentDraft(emptyAppointmentDraft);
    router.replace("/student/request-submitted");
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
          <button className={styles.submitButton} type="button" onClick={requestSubmission} disabled={!isAppointmentDraftComplete(draft) || submitting}>{submitting ? "Submitting..." : "Submit Request"}</button>
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
