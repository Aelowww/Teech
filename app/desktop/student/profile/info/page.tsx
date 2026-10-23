import { redirect } from "next/navigation";
import { Building2, GraduationCap, IdCard, UserRound } from "lucide-react";
import { DesktopLayout } from "@/app/desktop/_components/ui";
import { PersonalInfo } from "@/app/desktop/_components/personal-info";
import { createClient } from "@/lib/supabase/server";
import { DEPARTMENT, yearLevel } from "@/lib/department";
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
        fields={[
          { icon: UserRound, label: "Full Name", value: profile.full_name },
          { icon: IdCard, label: "Student ID", value: profile.student_number },
          { icon: Building2, label: "Department", value: DEPARTMENT },
          { icon: GraduationCap, label: "Year Level", value: yearLevel(profile.course_year) },
        ]}
      />
    </DesktopLayout>
  );
}
