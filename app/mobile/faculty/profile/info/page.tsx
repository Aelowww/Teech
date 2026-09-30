import { redirect } from "next/navigation";
import { Building2, IdCard, Mail, UserRound } from "lucide-react";
import { MobileLayout } from "@/app/mobile/_components/ui";
import { PersonalInfo } from "@/app/mobile/_components/personal-info";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/faculty/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, faculty_number, department, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "faculty") redirect("/faculty/sign-in");

  return (
    <MobileLayout className={styles.screen} backTo="/faculty/profile" role="faculty" activeNav="profile">
      <PersonalInfo
        editHref="/faculty/profile/edit"
        fields={[
          { icon: UserRound, label: "Full Name", value: profile.full_name },
          { icon: IdCard, label: "Faculty ID", value: profile.faculty_number },
          { icon: Building2, label: "Department", value: profile.department },
          { icon: Mail, label: "Email", value: profile.email },
        ]}
      />
    </MobileLayout>
  );
}
