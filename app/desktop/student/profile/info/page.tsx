import { redirect } from "next/navigation";
import { GraduationCap, IdCard, UserRound } from "lucide-react";
import { DesktopLayout } from "@/app/desktop/_components/ui";
import { PersonalInfo } from "@/app/desktop/_components/personal-info";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

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
    <DesktopLayout className={styles.screen} backTo="/student/profile" role="student" activeNav="profile">
      <PersonalInfo
        editHref="/student/profile/edit"
        fields={[
          { icon: UserRound, label: "Full Name", value: profile.full_name },
          { icon: IdCard, label: "Student ID", value: profile.student_number },
          { icon: GraduationCap, label: "Course and Year", value: profile.course_year },
        ]}
      />
    </DesktopLayout>
  );
}
