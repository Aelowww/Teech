import { redirect } from "next/navigation";
import { MobileLayout, PageHeading, ProfilePhoto } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, faculty_number, department, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/teacher/sign-in");

  return (
    <MobileLayout className={styles.screen} role="teacher" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="My Profile" />
        <div className={styles.identity}>
          <ProfilePhoto />
          <strong>{profile.full_name}</strong>
        </div>
        <dl className={styles.details}>
          <div><dt>Faculty ID</dt><dd>{profile.faculty_number}</dd></div>
          <div><dt>Department</dt><dd>{profile.department}</dd></div>
          <div><dt>Email</dt><dd>{profile.email}</dd></div>
        </dl>
        <div className={styles.signOut}><SignOutButton redirectTo="/teacher/sign-in" /></div>
      </div>
    </MobileLayout>
  );
}
