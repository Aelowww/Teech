import Link from "next/link";
import { Award, ChevronRight, FileText, KeyRound, ShieldCheck, ShieldQuestion, UserRound, type LucideIcon } from "lucide-react";
import { AvatarUploader } from "@/app/mobile/_components/avatar-uploader";
import { ShowcasedBadges } from "@/app/mobile/_components/showcased-badges";
import { SignOutButton } from "@/app/mobile/_components/sign-out-button";
import { DeleteAccountButton } from "@/app/mobile/_components/delete-account-button";
import { SupportChat } from "@/app/mobile/_components/support-chat";
import styles from "./profile-overview.module.css";

type Role = "student" | "faculty";

export function ProfileOverview({ role, name, avatarPath, photoUrl, badges }: { role: Role; name: string; avatarPath: string | null; photoUrl: string | null; badges: { id: string; name: string }[] }) {
  const base = `/${role}/profile`;
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>

      <header className={styles.identity}>
        <div className={styles.photo}><AvatarUploader initialPath={avatarPath} initialUrl={photoUrl} compact /></div>
        <strong>{name}</strong>
        <span>{role === "faculty" ? "Faculty member" : "Student"}</span>
        <ShowcasedBadges badges={badges} href={`${base}/badges`} />
      </header>

      <ProfileMenu role={role} />
    </div>
  );
}

function ProfileMenu({ role }: { role: Role }) {
  const base = `/${role}/profile`;
  return (
    <>
      <Group label="Account">
        <SettingLink href={`${base}/info`} icon={UserRound} label="Personal Information" />
        <SettingLink href={`${base}/badges`} icon={Award} label="Badges" />
      </Group>

      <Group label="Security">
        <SettingLink href={`${base}/password`} icon={KeyRound} label="Change Password" />
        <SettingLink href={`${base}/security`} icon={ShieldQuestion} label="Account Recovery" />
      </Group>

      <Group label="Help">
        <SupportChat audience={role} variant="row" className={styles.row} />
        <SettingLink href={`${base}/privacy`} icon={ShieldCheck} label="Privacy Policy" />
        <SettingLink href={`${base}/terms`} icon={FileText} label="Terms of Service" />
      </Group>

      <Group>
        <SignOutButton redirectTo="/welcome" variant="row" className={styles.row} />
        <DeleteAccountButton role={role} className={`${styles.row} ${styles.danger}`} />
      </Group>
    </>
  );
}

function Group({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <section className={styles.group} aria-label={label}>
      {label && <h2>{label}</h2>}
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

function SettingLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return <Link className={styles.row} href={href}><span><Icon size={15} />{label}</span><ChevronRight size={16} /></Link>;
}
