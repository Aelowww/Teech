"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
import { DesktopLayout, PageHeading, FormField } from "@/app/desktop/_components/ui";
import {
  emptyAppointmentDraft,
  getAppointmentDraft,
  isAppointmentDraftComplete,
  saveAppointmentDraft,
  type AppointmentDraft,
} from "@/lib/local-appointments";
import { createClient } from "@/lib/supabase/client";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { BookingSteps } from "@/app/desktop/_components/booking-steps";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import booking from "@/app/desktop/_components/booking.module.css";
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
    <DesktopLayout className={styles.screen} backTo="/student/select-date-time" role="student" activeNav="faculty">
      <BookingSteps current={3} />
      <form className={booking.layout} onSubmit={handleSubmit}>
        <section className={booking.main}>
          <PageHeading title="Appointment Information" subtitle="Enter the details for your consultation request." />
          <div className={styles.form}>
            <FormField label="Student Name" name="studentName" value={draft.studentName} placeholder="" readOnly required />
            <FormField label="Student ID" name="studentId" value={draft.studentId} placeholder="" readOnly required />
            <FormField label="Course and Year" name="courseYear" value={draft.courseYear} placeholder="" readOnly required />
            <FormField label="Faculty Member" name="facultyName" value={draft.facultyName} placeholder="" readOnly required />
            <div className={styles.fullRow}>
              <FormField label="Reason for Consultation" name="reason" value={draft.reason} onChange={updateField("reason")} placeholder="e.g. Thesis chapter 2 feedback" maxLength={200} required />
            </div>
            <div className={styles.fullRow}>
              <FormField label="Additional Details" name="details" value={draft.details} onChange={updateField("details")} placeholder="Anything the faculty member should know beforehand (optional)" maxLength={1000} />
            </div>
          </div>
        </section>

        <aside className={booking.side}>
          <h2>Your consultation</h2>
          <dl className={booking.summaryList}>
            <div><UserRound size={18} /><dt>Faculty</dt><dd>{draft.facultyName}</dd></div>
            <div><CalendarDays size={18} /><dt>Date</dt><dd>{draft.preferredDate ? formatLongDate(draft.preferredDate) : ""}</dd></div>
            <div><Clock3 size={18} /><dt>Time</dt><dd>{draft.preferredTime}</dd></div>
            {draft.meetingLocation && <div><MapPin size={18} /><dt>Meeting location</dt><dd>{draft.meetingLocation}</dd></div>}
          </dl>
          <button className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.block} ${booking.continueButton}`} type="submit">Review Appointment<ArrowRight size={17} /></button>
        </aside>
      </form>
    </DesktopLayout>
  );
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
