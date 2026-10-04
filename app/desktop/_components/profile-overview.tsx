import Link from "next/link";
import { Award, BadgeCheck, ChevronRight, FileText, KeyRound, Pencil, ShieldCheck, ShieldQuestion, type LucideIcon } from "lucide-react";
import { AvatarUploader } from "@/app/desktop/_components/avatar-uploader";
import { ShowcasedBadges } from "@/app/desktop/_components/showcased-badges";
import { SignOutButton } from "@/app/desktop/_components/sign-out-button";
import { DeleteAccountButton } from "@/app/desktop/_components/delete-account-button";
import { SupportChat } from "@/app/desktop/_components/support-chat";
import buttonStyles from "@/app/desktop/_components/button.module.css";
import styles from "./profile-overview.module.css";

type Role = "student" | "faculty";
type Detail = { label: string; value: string | null };

export function ProfileOverview({
  role,
  name,
  avatarPath,
  photoUrl,
  badges,
  details = [],
  chips = [],
}: {
  role: Role;
  name: string;
  avatarPath: string | null;
  photoUrl: string | null;
  badges: { id: string; name: string }[];
  details?: Detail[];
  chips?: string[];
}) {
  const base = `/${role}/profile`;
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.layout}>
        <aside className={styles.identity}>
          <div className={styles.cover} aria-hidden="true" />
          <div className={styles.photo}><AvatarUploader initialPath={avatarPath} initialUrl={photoUrl} compact /></div>
          <div className={styles.identityText}>
            <strong>{name}</strong>
            <span>{role === "faculty" ? "Faculty member" : "Student"}</span>
          </div>
          {chips.length > 0 && <div className={styles.chips}>{chips.map((chip) => <span key={chip}>{chip}</span>)}</div>}
          <div className={styles.badges}>
            <small>Showcased badges</small>
            {badges.length
              ? <ShowcasedBadges badges={badges} href={`${base}/badges`} />
              : <Link className={styles.badgesEmpty} href={`${base}/badges`}>Choose up to 3<ChevronRight size={14} /></Link>}
          </div>
          <div className={styles.signOut}><SignOutButton redirectTo="/welcome" /></div>
        </aside>

        <div className={styles.content}>
          <section className={styles.infoCard} aria-label="Personal information">
            <header className={styles.cardHead}>
              <h2>Personal information</h2>
              <Link className={`${buttonStyles.button} ${buttonStyles.secondary} ${styles.edit}`} href={`${base}/edit`}><Pencil size={14} />Edit</Link>
            </header>
            <dl className={styles.details}>
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className={value ? "" : styles.empty}>{value || "Not set"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className={styles.groups}>
            <Group label="Account & security">
              <SettingLink href={`${base}/badges`} icon={Award} label="Badges" />
              <SettingLink href={`/${role}/verification`} icon={BadgeCheck} label="ID Verification" />
              <SettingLink href={`${base}/password`} icon={KeyRound} label="Change Password" />
              <SettingLink href={`${base}/security`} icon={ShieldQuestion} label="Account Recovery" />
            </Group>

            <Group label="Help & legal">
              <SupportChat audience={role} variant="row" className={styles.row} />
              <SettingLink href={`${base}/privacy`} icon={ShieldCheck} label="Privacy Policy" />
              <SettingLink href={`${base}/terms`} icon={FileText} label="Terms of Service" />
            </Group>
          </div>

          <section className={styles.dangerZone} aria-label="Danger zone">
            <div>
              <strong>Delete account</strong>
              <small>Permanently remove your profile and consultation history. This can&apos;t be undone.</small>
            </div>
            <DeleteAccountButton role={role} className={`${styles.row} ${styles.danger}`} />
          </section>
        </div>
      </div>
    </div>
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
