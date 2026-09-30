"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { FormField, DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { SignOutEverywhere } from "@/app/desktop/_components/sign-out-everywhere";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/desktop/_components/profile-settings.module.css";

const emptyTrio = ["", "", ""];

export default function Page() {
  const router = useRouter();
  const [options, setOptions] = useState<string[]>([]);
  const [questions, setQuestions] = useState(emptyTrio);
  const [answers, setAnswers] = useState(emptyTrio);
  const [currentPassword, setCurrentPassword] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadQuestions() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/student/sign-in"); return; }
      const [optionsResult, savedResult] = await Promise.all([
        supabase.rpc("security_question_options"),
        supabase.from("student_security_answers").select("question").order("question"),
      ]);
      if (!active) return;
      if (optionsResult.error || savedResult.error) {
        setError(optionsResult.error?.message || savedResult.error?.message || "Security questions could not be loaded.");
      } else {
        setOptions((optionsResult.data || []) as string[]);
        const saved = (savedResult.data || []).map((row) => row.question as string);
        if (saved.length === 3) {
          setQuestions(saved);
          setIsConfigured(true);
        }
      }
      setIsLoading(false);
    }
    void loadQuestions();
    return () => { active = false; };
  }, [router]);

  if (isLoading) return <AppLoader />;

  function updateAt(list: string[], index: number, value: string) {
    return list.map((item, itemIndex) => itemIndex === index ? value : item);
  }

  async function saveQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (questions.some((question) => !question) || new Set(questions).size !== 3) {
      setError("Choose three different questions.");
      return;
    }
    if (answers.some((answer) => answer.trim().length < 2)) {
      setError("Each answer must be at least 2 characters.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setSaving(false); router.replace("/student/sign-in"); return; }
    // Security answers can reset the password, so changing them requires the current password.
    const { error: passwordError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (passwordError) {
      setSaving(false);
      setError("Your current password is incorrect.");
      return;
    }
    const { error: saveError } = await supabase.rpc("set_security_answers", { questions, answers });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setAnswers(emptyTrio);
    setCurrentPassword("");
    setIsConfigured(true);
    setNotice("Your security questions have been saved.");
  }

  return (
    <DesktopLayout className={styles.screen} backTo="/student/profile" role="student" activeNav="profile">
      <form className={styles.page} onSubmit={saveQuestions}>
        <PageHeading title="Account Recovery" subtitle="Security questions let you reset your password if you forget it." />
        <p className={`${styles.securityStatus} ${isConfigured ? styles.securityStatusReady : ""}`}>
          <ShieldCheck size={15} />
          {isConfigured ? "Set up. Saving again replaces your current answers." : "Not set up yet. You won't be able to reset a forgotten password."}
        </p>
        <div className={styles.form}>
          {questions.map((question, index) => (
            <div className={styles.securityQuestion} key={index}>
              <label>
                <span>Question {index + 1}</span>
                <select className={styles.select} value={question} onChange={(event) => setQuestions((current) => updateAt(current, index, event.target.value))} required>
                  <option value="" disabled>Choose a question</option>
                  {options.map((option) => (
                    <option key={option} value={option} disabled={questions.includes(option) && option !== question}>{option}</option>
                  ))}
                </select>
              </label>
              <FormField label={`Answer ${index + 1}`} name={`answer${index + 1}`} value={answers[index]} onChange={(event) => setAnswers((current) => updateAt(current, index, event.target.value))} placeholder="Your answer" maxLength={100} required />
            </div>
          ))}
          <p className={styles.passwordHint}>Answers are not case-sensitive. Pick answers only you would know.</p>
          <PasswordField label="Current Password" name="currentPassword" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Confirm it's you" autoComplete="current-password" required />
        </div>
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
        <div className={styles.submitArea}><button className={styles.submitButton} type="submit" disabled={saving}>{saving ? "Saving..." : "Save Security Questions"}</button></div>
        <SignOutEverywhere role="student" />
      </form>
    </DesktopLayout>
  );
}
