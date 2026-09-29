"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout, PageHeading, FormField, Notice } from "@/app/mobile/_components/ui";
import { PasswordField } from "@/app/mobile/_components/password-field";
import { createClient } from "@/lib/supabase/client";
import { getPasswordError, passwordRequirementText } from "@/lib/password";
import styles from "./page.module.css";

const resetMessages: Record<string, string> = {
  invalid: "Those answers don't match our records. Check your Student ID and answers.",
  locked: "Too many incorrect attempts. Password reset is paused for now, so please try again later or ask your instructor for help.",
  weak_password: passwordRequirementText,
};

export default function Page() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { data, error: questionError } = await createClient().rpc("get_security_questions", { requested_student_number: studentId });
    setSubmitting(false);
    if (questionError || !data) {
      setError(questionError?.message || "Security questions could not be loaded.");
      return;
    }
    setQuestions(data as string[]);
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const passwordError = getPasswordError(password);
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    const { data, error: resetError } = await createClient().rpc("reset_student_password", {
      requested_student_number: studentId,
      questions,
      answers,
      new_password: password,
    });
    setSubmitting(false);
    if (resetError) { setError(resetError.message); return; }
    if (data !== "ok") { setError(resetMessages[data as string] || "Your password could not be reset."); return; }
    router.replace("/student/password-reset");
  }

  function startOver() {
    setQuestions([]);
    setAnswers(["", "", ""]);
    setPassword("");
    setConfirmation("");
    setError("");
  }

  if (!questions.length) {
    return (
      <MobileLayout className={styles.screen} backTo="/student/sign-in">
        <form className={styles.page} onSubmit={loadQuestions}>
          <PageHeading title="Password Recovery" subtitle="Answer your security questions to choose a new password." />
          <div className={styles.form}>
            <FormField label="Student ID" name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter your student ID" required />
          </div>
          <p className={styles.hint}>Haven&apos;t set up security questions? Ask your instructor or system administrator to reset your password.</p>
          {error && <Notice error>{error}</Notice>}
          <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Loading..." : "Continue"}</button>
        </form>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className={styles.screen} backTo="/student/sign-in">
      <form className={styles.page} onSubmit={resetPassword}>
        <PageHeading title="Security Questions" subtitle={`Student ID ${studentId.trim()}`} />
        <div className={styles.form}>
          {questions.map((question, index) => (
            <FormField
              key={question}
              label={question}
              name={`answer${index + 1}`}
              value={answers[index]}
              onChange={(event) => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))}
              placeholder="Your answer"
              maxLength={100}
              required
            />
          ))}
          <PasswordField label="New Password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" autoComplete="new-password" minLength={8} required />
          <p className={styles.hint}>{passwordRequirementText}</p>
          <PasswordField label="Confirm New Password" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Re-enter your new password" autoComplete="new-password" minLength={8} required />
        </div>
        {error && <Notice error>{error}</Notice>}
        <button className={styles.submitButton} type="submit" disabled={submitting}>{submitting ? "Resetting..." : "Reset Password"}</button>
        <button className={styles.textButton} type="button" onClick={startOver}>Use a different Student ID</button>
      </form>
    </MobileLayout>
  );
}
