"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, PageHeading, FormField } from "@/app/mobile/_components/ui";
import {
  emptyAppointmentDraft,
  getAppointmentDraft,
  isAppointmentDraftComplete,
  saveAppointmentDraft,
  type AppointmentDraft,
} from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/mobile/_components/app-loader";
import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const [draft, setDraft] = useState<AppointmentDraft>(emptyAppointmentDraft);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDraft() {
      const storedDraft = getAppointmentDraft();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) {
        if (active) {
          setDraft(storedDraft);
          setIsLoading(false);
        }
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, student_number, course_year")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!active) return;

      const updatedDraft = profile ? {
        ...storedDraft,
        studentName: profile.full_name,
        studentId: profile.student_number || "",
        courseYear: profile.course_year || "",
      } : storedDraft;
      setDraft(updatedDraft);
      saveAppointmentDraft(updatedDraft);
      setIsLoading(false);
    }
    void loadDraft();
    return () => { active = false; };
  }, []);

  if (isLoading) return <AppLoader />;

  function updateField(field: keyof AppointmentDraft) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setDraft((currentDraft) => ({ ...currentDraft, [field]: event.target.value }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAppointmentDraftComplete(draft)) {
      router.push("/student/calendar");
      return;
    }
    saveAppointmentDraft(draft);
    router.push("/student/appointment-review");
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/select-date-time">
      <form className={styles.page} onSubmit={handleSubmit}>
        <PageHeading title="Appointment Information" subtitle="Enter the details for your consultation request." />
        <div className={styles.form}>
          <FormField label="Student Name" name="studentName" value={draft.studentName} placeholder="" readOnly required />
          <FormField label="Student ID" name="studentId" value={draft.studentId} placeholder="" readOnly required />
          <FormField label="Course and Year" name="courseYear" value={draft.courseYear} placeholder="" readOnly required />
          <FormField label="Faculty Member" name="facultyName" value={draft.facultyName} placeholder="" readOnly required />
          <FormField label="Reason for Consultation" name="reason" value={draft.reason} onChange={updateField("reason")} placeholder="" maxLength={200} required />
          <FormField label="Additional Details" name="details" value={draft.details} onChange={updateField("details")} placeholder="" maxLength={1000} />
        </div>
        <div className={styles.submitArea}>
          <button className={styles.submitButton} type="submit">Review Appointment</button>
        </div>
      </form>
    </MobileLayout>
  );
}
