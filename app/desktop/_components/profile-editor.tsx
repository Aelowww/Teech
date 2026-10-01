"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField, DesktopLayout, Notice, PageHeading } from "@/app/desktop/_components/ui";
import { AvatarUploader } from "@/app/desktop/_components/avatar-uploader";
import { AppLoader } from "@/app/desktop/_components/app-loader";
import { createClient } from "@/lib/supabase/client";
import buttonStyles from "@/app/desktop/_components/button.module.css";
<<<<<<< HEAD
=======
import { SuccessModal } from "./success-modal";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import styles from "./profile-settings.module.css";

type Role = "student" | "faculty";

export function ProfileEditor({ role }: { role: Role }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [courseYear, setCourseYear] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
=======
  const [saved, setSaved] = useState(false);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
  const [isLoading, setIsLoading] = useState(true);

  const profilePath = `/${role}/profile/info`;
  const signInPath = `/${role}/sign-in`;

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(signInPath); return; }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, department, course_year, role, avatar_path")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setIsLoading(false);
      if (profileError || !profile || profile.role !== role) {
        setError(profileError?.message || "Your profile could not be loaded.");
        return;
      }
      setFullName(profile.full_name || "");
      if (role === "faculty") {
        const profileEmail = user.email || profile.email || "";
        setEmail(profileEmail);
        setInitialEmail(profileEmail);
      }
      setDepartment(profile.department || "");
      setCourseYear(profile.course_year || "");
      setAvatarPath(profile.avatar_path || null);
    }
    void loadProfile();
    return () => { active = false; };
  }, [role, router, signInPath]);

  if (isLoading) return <AppLoader />;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); router.replace(signInPath); return; }

    const updates = role === "faculty"
      ? { full_name: fullName.trim(), department: department.trim() }
      : { full_name: fullName.trim(), course_year: courseYear.trim() };
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("auth_user_id", user.id);
    if (updateError) { setSaving(false); setError(updateError.message); return; }

    const updatedEmail = email.trim().toLowerCase();
    if (role === "faculty" && updatedEmail !== initialEmail.toLowerCase()) {
      const { data, error: emailError } = await supabase.auth.updateUser(
        { email: updatedEmail },
        { emailRedirectTo: `${window.location.origin}/${role}/profile` },
      );
      setSaving(false);
      if (emailError) { setError(emailError.message); return; }
      if (data.user?.email !== updatedEmail) {
        setNotice("Check your current and new email inboxes to confirm the email change.");
        return;
      }
    } else {
      setSaving(false);
    }

<<<<<<< HEAD
=======
    setSaved(true);
  }

  function finishSave() {
    setSaved(false);
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    router.replace(profilePath);
    router.refresh();
  }

  return (
    <DesktopLayout
      className={styles.screen}
      backTo={profilePath}
      role={role}
      activeNav="profile"
    >
      <form className={styles.page} onSubmit={saveProfile}>
        <PageHeading title="Edit Profile" subtitle="Update the information shown in your portal." />
        {avatarPath !== undefined && <div className={styles.photoEditor}><AvatarUploader initialPath={avatarPath} /></div>}
        <div className={styles.form}>
          <FormField label="Full Name" name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" required />
          {role === "faculty" && <FormField label="School Email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" type="email" required />}
          {role === "faculty"
            ? <FormField label="Department" name="department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Enter your department" required />
            : <FormField label="Course and Year" name="courseYear" value={courseYear} onChange={(event) => setCourseYear(event.target.value)} placeholder="Enter your course and year" required />}
        </div>
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
        <div className={styles.submitArea}><button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
      </form>
<<<<<<< HEAD
=======
      <SuccessModal open={saved} title="Profile updated" description="Your changes have been saved." onDone={finishSave} />
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    </DesktopLayout>
  );
}
