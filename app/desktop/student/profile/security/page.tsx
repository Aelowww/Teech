"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { PasswordField } from "@/app/desktop/_components/password-field";
import { SignOutEverywhere } from "@/app/desktop/_components/sign-out-everywhere";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import styles from "@/app/desktop/_components/profile-settings.module.css";
import pageStyles from "./page.module.css";

const emptyTrio = ["", "", ""];

export default function Page() {
  const router = useRouter();
  const [options, setOptions] = useState<string[]>([]);
  const [questions, setQuestions] = useState(emptyTrio);
  const [answers, setAnswers] = useState(emptyTrio);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetUp, setIsSetUp] = useState(false);

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
          setIsSetUp(true);
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
    setIsSetUp(true);
    setNotice("Your security questions have been saved.");
  }

  return (
    <DesktopLayout className={styles.screen} backTo="/student/profile" role="student" activeNav="profile">
      <form className={styles.page} onSubmit={saveQuestions}>
        <PageHeading title="Account Recovery" subtitle="Security questions let you reset your password if you forget it." />
        <p className={`${pageStyles.status} ${isSetUp ? pageStyles.statusOn : ""}`}>
          {isSetUp ? <ShieldCheck size={15} aria-hidden="true" /> : <ShieldAlert size={15} aria-hidden="true" />}
          {isSetUp ? "Recovery is set up. Save again to change it." : "Not set up yet"}
        </p>

        <ol className={pageStyles.questions}>
          {questions.map((question, index) => (
            <li key={index}>
              <span className={pageStyles.step} aria-hidden="true">{index + 1}</span>
              <div className={pageStyles.pair}>
                <div className={pageStyles.selectWrap}>
                  <select aria-label={`Question ${index + 1}`} className={question ? "" : pageStyles.placeholder} value={question} onChange={(event) => setQuestions((current) => updateAt(current, index, event.target.value))} required>
                    <option value="" disabled>Choose a question</option>
                    {options.map((option) => (
                      <option key={option} value={option} disabled={questions.includes(option) && option !== question}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </div>
                <input aria-label={`Answer ${index + 1}`} name={`answer${index + 1}`} value={answers[index]} onChange={(event) => setAnswers((current) => updateAt(current, index, event.target.value))} placeholder="Your answer" maxLength={100} autoComplete="off" required />
              </div>
            </li>
          ))}
        </ol>
        <p className={pageStyles.hint}><Info size={13} aria-hidden="true" />Answers aren&apos;t case-sensitive. Pick ones only you would know.</p>

        <div className={pageStyles.confirm}>
          <PasswordField label="Confirm it's you" name="currentPassword" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Your current password" autoComplete="current-password" required />
        </div>
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
        <div className={pageStyles.submit}><button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving}>{saving ? "Saving..." : "Save questions"}</button></div>
        <SignOutEverywhere />
      </form>
    </DesktopLayout>
  );
}
