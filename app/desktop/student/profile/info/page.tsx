import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { DesktopLayout, PageHeading } from "@/app/desktop/_components/ui";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/desktop/_components/profile-settings.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/student/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, student_number, course_year, role, avatar_path")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "student") redirect("/student/sign-in");

  return (
    <DesktopLayout className={styles.screen} backTo="/student/profile" role="student" activeNav="profile">
      <div className={styles.page}>
        <PageHeading title="Personal Information" subtitle="The details shown in your portal." />
        <section className={styles.informationCard}>
          <div className={styles.informationHeader}>
            <h2>Your Details</h2>
            <Link className={styles.editLink} href="/student/profile/edit"><Pencil size={14} />Edit</Link>
          </div>
          <dl className={styles.details}>
            <div><dt>Full Name</dt><dd>{profile.full_name || "Not set"}</dd></div>
            <div><dt>Student ID</dt><dd>{profile.student_number || "Not set"}</dd></div>
            <div><dt>Course and Year</dt><dd>{profile.course_year || "Not set"}</dd></div>
          </dl>
        </section>
      </div>
    </DesktopLayout>
  );
}
