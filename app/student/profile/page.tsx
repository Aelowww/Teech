import { redirect } from "next/navigation";
import { MobileLayout, PageHeading } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/student/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, student_number, course_year, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "student") redirect("/student/sign-in");

  return (
    <MobileLayout className={styles.screen} role="student" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="Profile" subtitle={profile.full_name} />
        <dl className={styles.details}>
          <div><dt>Student ID</dt><dd>{profile.student_number}</dd></div>
          <div><dt>Course and Year</dt><dd>{profile.course_year}</dd></div>
        </dl>
        <div className={styles.signOut}><SignOutButton redirectTo="/student/sign-in" /></div>
      </div>
    </MobileLayout>
  );
}
