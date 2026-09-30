import Link from "next/link";
import {
  Award,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  GraduationCap,
  Hash,
  IdCard,
  Info,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";
import { ActionButtons, BrandLogo, PageHeading } from "@/app/mobile/_components/ui";
import { Bone, SkeletonScreen, TextBone, skeletonStyles as sk } from "@/app/mobile/_components/skeleton";
import { LoginStreakSkeleton } from "@/app/mobile/_components/login-streak";
import { ProfileOverviewSkeleton } from "@/app/mobile/_components/profile-overview";
import { PersonalInfoSkeleton } from "@/app/mobile/_components/personal-info";
import { SignOutEverywhere } from "@/app/mobile/_components/sign-out-everywhere";
import ui from "@/app/mobile/_components/ui.module.css";
import buttonStyles from "@/app/mobile/_components/button.module.css";
import bellStyles from "@/app/mobile/_components/notification-bell.module.css";
import settings from "@/app/mobile/_components/profile-settings.module.css";
import notificationStyles from "@/app/mobile/_components/notifications-feed.module.css";
import pointsStyles from "@/app/mobile/_components/points-shop.module.css";
import badgeStyles from "@/app/mobile/_components/badge-grid.module.css";
import studentHome from "@/app/mobile/student/home/page.module.css";
import facultyHome from "@/app/mobile/faculty/home/page.module.css";
import studentRequests from "@/app/mobile/student/appointment-requests/page.module.css";
import facultyRequests from "@/app/mobile/faculty/requests/page.module.css";
import requestDetail from "@/app/mobile/student/appointment-requests/[id]/page.module.css";
import studentCalendar from "@/app/mobile/student/calendar/page.module.css";
import facultyCalendar from "@/app/mobile/faculty/calendar/page.module.css";
import availabilityStyles from "@/app/mobile/faculty/availability/page.module.css";
import selectTime from "@/app/mobile/student/select-date-time/page.module.css";
import appointmentInfo from "@/app/mobile/student/appointment-info/page.module.css";
import studentSecurity from "@/app/mobile/student/profile/security/page.module.css";
import directory from "@/app/mobile/student/faculty/page.module.css";
import profileStyles from "@/app/mobile/student/profile/page.module.css";

type Role = "student" | "faculty";

function repeat<T>(count: number, render: (index: number) => T) {
  return Array.from({ length: count }, (_, index) => render(index));
}

function pick<T>(values: T[], index: number) {
  return values[index % values.length];
}

function StaticBell() {
  return <span className={bellStyles.bell} aria-hidden="true"><Bell size={19} /></span>;
}

function HeadingSkeleton({ titleWidth = 190, subtitleWidth = 250 }: { titleWidth?: number; subtitleWidth?: number }) {
  return (
    <>
      <TextBone size={25} width={titleWidth} lineHeight={1.2} center />
      <div className={ui.subtitle}><TextBone size={12} width={subtitleWidth} lineHeight={1.55} center /></div>
    </>
  );
}

function SubtitleSkeleton({ width }: { width: number }) {
  return <div className={ui.subtitle}><TextBone size={12} width={width} lineHeight={1.55} center /></div>;
}

function TabsSkeleton({ labels, packed = false }: { labels: string[]; packed?: boolean }) {
  return (
    <div className={`${sk.tabs} ${packed ? sk.tabsPacked : ""}`} aria-hidden="true">
      {labels.map((label) => <span key={label}>{label}<i /></span>)}
    </div>
  );
}

function FieldSkeleton({ label, height = 43, radius = 10 }: { label: string; height?: number; radius?: number }) {
  return (
    <div className={ui.field}>
      <span>{label}</span>
      <Bone width="100%" height={height} radius={radius} />
    </div>
  );
}

function DisabledButton({ label }: { label: string }) {
  return <button className={`${buttonStyles.button} ${buttonStyles.primary}`} type="button" disabled>{label}</button>;
}

function UpNextSkeleton() {
  return (
    <div className={sk.card}>
      <Bone width={52} height={56} radius={12} />
      <div className={sk.lines}>
        <TextBone size={10} width={56} />
        <TextBone size={15} width="68%" />
        <TextBone size={12} width="84%" />
      </div>
      <ChevronRight className={sk.chevron} size={18} aria-hidden="true" />
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className={sk.listCard}>
      <Bone height={40} round />
      <div className={sk.lines}>
        <TextBone size={13} width="52%" />
        <TextBone size={11} width="78%" lineHeight={1.4} />
        <Bone width={58} height={17} pill style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}

function CalendarSkeleton({ legend }: { legend: string }) {
  return (
    <div className={ui.calendar} aria-hidden="true">
      <div className={sk.calendarHeader}>
        <ChevronLeft size={14} />
        <TextBone size={12} width={96} />
        <ChevronRight size={14} />
      </div>
      <div className={ui.legend}><i /> {legend}</div>
      <div className={ui.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span className={ui.weekday} key={index}>{day}</span>)}
        {repeat(35, (index) => <span className={sk.day} key={index}><Bone width={12} height={8} radius={3} /></span>)}
      </div>
    </div>
  );
}

export function StudentHomeSkeleton() {
  return (
    <SkeletonScreen className={studentHome.screen} pageClassName={studentHome.page} role="student" activeNav="home">
      <header className={studentHome.header}><BrandLogo /><StaticBell /></header>
      <div className={studentHome.greeting}>
        <Bone height={52} round />
        <div className={sk.stack}><TextBone size={12} width={96} /><TextBone size={19} width={160} /></div>
        <Bone height={34} round />
      </div>
      <UpNextSkeleton />
      <LoginStreakSkeleton />
      <h2 className={studentHome.sectionTitle}>Awaiting Response</h2>
      <ListCardSkeleton />
    </SkeletonScreen>
  );
}

export function FacultyHomeSkeleton() {
  return (
    <SkeletonScreen className={facultyHome.screen} pageClassName={facultyHome.page} role="faculty" activeNav="home">
      <header className={facultyHome.header}>
        <BrandLogo />
        <div className={facultyHome.headerActions}><Bone height={34} round /><StaticBell /></div>
      </header>
      <div className={facultyHome.greeting}>
        <Bone height={52} round />
        <div className={`${facultyHome.greetingText} ${sk.stack}`}><TextBone size={12} width={96} /><TextBone size={19} width={150} /></div>
        <Bone width={112} height={34} pill />
      </div>
      <UpNextSkeleton />
      <LoginStreakSkeleton />
      <h2 className={facultyHome.sectionTitle}>Needs Your Response</h2>
      <ListCardSkeleton />
    </SkeletonScreen>
  );
}

const requestTabs = ["All", "Pending", "Confirmed", "Closed"];

export function StudentRequestsSkeleton() {
  return (
    <SkeletonScreen className={studentRequests.screen} pageClassName={studentRequests.page} backTo="/student/home" role="student" activeNav="requests">
      <PageHeading title="Requests" subtitle="Manage your consultation requests." />
      <TabsSkeleton labels={requestTabs} />
      <ul className={`${sk.rows} ${studentRequests.requests}`}>
        {repeat(5, (index) => (
          <li className={sk.row} key={index}>
            <Bone height={44} round />
            <div className={sk.lines}>
              <TextBone size={14} width={pick(["58%", "46%", "64%"], index)} />
              <TextBone size={12} width={pick(["44%", "52%", "40%"], index)} />
              <TextBone size={12} width={pick(["72%", "60%", "80%"], index)} />
            </div>
            <Bone width={64} height={21} pill />
            <ChevronRight className={sk.chevron} size={16} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </SkeletonScreen>
  );
}

export function FacultyRequestsSkeleton() {
  return (
    <SkeletonScreen className={facultyRequests.screen} pageClassName={facultyRequests.page} backTo="/faculty/home" role="faculty" activeNav="requests">
      <PageHeading title="Requests" subtitle="Approve or decline student consultation requests." />
      <TabsSkeleton labels={requestTabs} />
      <div className={facultyRequests.requests}>
        {repeat(4, (index) => (
          <div className={facultyRequests.requestCard} key={index}>
            <Bone height={38} round />
            <div className={facultyRequests.copy}>
              <TextBone size={13} width={pick(["60%", "48%", "66%"], index)} />
              <TextBone size={10} width="54%" lineHeight={1.4} />
              <TextBone size={10} width={pick(["80%", "68%", "74%"], index)} lineHeight={1.4} />
              <TextBone size={10} width={44} />
            </div>
            <div className={facultyRequests.actions}><Bone height={31} radius={6} /><Bone height={31} radius={6} /></div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}

export function RequestDetailSkeleton({ role }: { role: Role }) {
  const details = [
    { icon: CalendarDays, label: "When", widths: ["72%"] },
    { icon: MapPin, label: "Where", widths: ["56%"] },
    { icon: FileText, label: "Reason", widths: ["88%", "60%"] },
    { icon: Hash, label: "Reference", widths: ["46%"] },
  ];
  return (
    <SkeletonScreen
      className={requestDetail.screen}
      pageClassName={requestDetail.page}
      backTo={role === "faculty" ? "/faculty/requests" : "/student/appointment-requests"}
      role={role}
      activeNav="requests"
    >
      <div className={sk.hero}>
        <Bone height={52} round style={{ marginBottom: 14 }} />
        <TextBone size={22} width={210} lineHeight={1.25} />
        <div className={sk.heroSubtitle}>
          <TextBone size={13} width={250} lineHeight={1.5} />
          <TextBone size={13} width={160} lineHeight={1.5} />
        </div>
      </div>
      <div className={sk.timeline} aria-hidden="true">
        {repeat(3, (index) => <div key={index}><Bone height={20} round /><TextBone size={11} width={48} /></div>)}
      </div>
      <div className={requestDetail.faculty}>
        <Bone height={48} round />
        <div><TextBone size={15} width={150} /><TextBone size={12} width={120} /></div>
      </div>
      <dl className={requestDetail.details}>
        {details.map(({ icon: Icon, label, widths }) => (
          <div key={label}>
            <dt><Icon size={16} aria-hidden="true" />{label}</dt>
            <dd>{widths.map((width) => <TextBone key={width} size={13} width={width} lineHeight={1.45} />)}</dd>
          </div>
        ))}
      </dl>
    </SkeletonScreen>
  );
}

export function StudentCalendarSkeleton() {
  return (
    <SkeletonScreen className={studentCalendar.screen} pageClassName={studentCalendar.page} backTo="/student/home" role="student" activeNav="faculty">
      <HeadingSkeleton titleWidth={180} subtitleWidth={240} />
      <CalendarSkeleton legend="Available dates" />
      <button className={`${buttonStyles.button} ${buttonStyles.primary} ${studentCalendar.continueButton}`} type="button" disabled>Continue</button>
    </SkeletonScreen>
  );
}

export function FacultyCalendarSkeleton() {
  return (
    <SkeletonScreen className={facultyCalendar.screen} pageClassName={facultyCalendar.page} role="faculty" activeNav="calendar">
      <PageHeading title="Calendar" subtitle="Your published consultation dates." />
      <CalendarSkeleton legend="Available to students" />
      <section className={facultyCalendar.summary}>
        <Bone height={34} radius={9} />
        <div className={sk.lines}>
          <TextBone size={12} width="66%" />
          <TextBone size={10} width="88%" lineHeight={1.4} />
        </div>
      </section>
      <ActionButtons actions={[{ label: "Manage Availability", href: "/faculty/availability" }]} primaryLabel="Manage Availability" />
    </SkeletonScreen>
  );
}

export function AvailabilitySkeleton() {
  return (
    <SkeletonScreen className={availabilityStyles.screen} pageClassName={availabilityStyles.page} backTo="/faculty/calendar" role="faculty" activeNav="calendar">
      <PageHeading title="Availability" subtitle="Choose specific dates and times students can request." />
      <CalendarSkeleton legend="Outlined dates are available to students" />
      <section className={availabilityStyles.editor} aria-hidden="true">
        <p className={availabilityStyles.selectedDate}>Select one or more dates from the calendar</p>
        <div className={availabilityStyles.times}>
          <label>Start time<Bone width="100%" height={42} radius={8} /></label>
          <label>End time<Bone width="100%" height={42} radius={8} /></label>
        </div>
        <label className={availabilityStyles.location}>
          Meeting room or location <span className={availabilityStyles.required}>(required)</span>
          <Bone width="100%" height={42} radius={8} />
        </label>
      </section>
      <div className={availabilityStyles.saveArea}><DisabledButton label="Save Selected Dates" /></div>
    </SkeletonScreen>
  );
}

export function SelectTimeSkeleton() {
  return (
    <SkeletonScreen className={selectTime.screen} pageClassName={selectTime.page} backTo="/student/calendar">
      <PageHeading title="Choose a time" />
      <SubtitleSkeleton width={130} />
      <div className={ui.availabilityForm}>
        {["Morning", "Afternoon"].map((label) => (
          <section className={ui.slotGroup} key={label}>
            <p className={ui.slotLabel}>{label}</p>
            {repeat(4, (index) => <Bone key={index} width="100%" height={42} radius={10} />)}
          </section>
        ))}
      </div>
      <button className={`${buttonStyles.button} ${buttonStyles.primary} ${selectTime.continueButton}`} type="button" disabled>Continue</button>
    </SkeletonScreen>
  );
}

export function AppointmentInfoSkeleton() {
  const labels = ["Student Name", "Student ID", "Course and Year", "Faculty Member", "Reason for Consultation", "Additional Details"];
  return (
    <SkeletonScreen className={appointmentInfo.screen} pageClassName={appointmentInfo.page} backTo="/student/select-date-time">
      <PageHeading title="Appointment Information" subtitle="Enter the details for your consultation request." />
      <div className={appointmentInfo.form}>{labels.map((label) => <FieldSkeleton key={label} label={label} />)}</div>
      <div className={appointmentInfo.submitArea}><DisabledButton label="Review Appointment" /></div>
    </SkeletonScreen>
  );
}

export function NotificationsSkeleton({ role }: { role: Role }) {
  return (
    <SkeletonScreen className={notificationStyles.screen} pageClassName={notificationStyles.page} backTo={`/${role}/home`} role={role}>
      <PageHeading title="Notifications" subtitle="Stay updated on your account and consultations." />
      <div className={notificationStyles.toolbar}><TextBone size={12} width={64} /><TextBone size={12} width={112} /></div>
      <div className={notificationStyles.updates}>
        <section>
          <div className={notificationStyles.groupLabel}><TextBone size={11} width={48} /></div>
          <div className={notificationStyles.groupList}>
            {repeat(5, (index) => (
              <div className={sk.notification} key={index}>
                <Bone height={36} round />
                <div className={sk.lines}>
                  <div className={sk.titleRow}>
                    <TextBone size={13} width={pick(["55%", "42%", "62%"], index)} />
                    <TextBone size={11} width={36} />
                  </div>
                  <TextBone size={12} width="94%" lineHeight={1.45} />
                  <TextBone size={12} width={pick(["58%", "70%", "46%"], index)} lineHeight={1.45} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SkeletonScreen>
  );
}

export function PointsSkeleton({ role }: { role: Role }) {
  return (
    <SkeletonScreen className={pointsStyles.screen} pageClassName={pointsStyles.page} backTo={`/${role}/home`} role={role} activeNav="home">
      <PageHeading title="Points" subtitle="Earn points by showing up. Spend them on rewards." />
      <section className={pointsStyles.balance}>
        <span><Coins size={22} /></span>
        <div>
          <small>Your balance</small>
          <TextBone size={26} width={92} onDark />
        </div>
      </section>

      <h2 className={pointsStyles.sectionTitle}>How to earn</h2>
      <div className={pointsStyles.earn}>
        <div><CalendarCheck size={16} /><span>Daily check-in</span><b>+5 to +25</b></div>
        <div><Award size={16} /><span>Earn a badge</span><b>+20</b></div>
      </div>
      <p className={pointsStyles.hint}>Check-in points rise each day of your streak and peak on day 7.</p>

      <h2 className={pointsStyles.sectionTitle}>Rewards</h2>
      <div className={pointsStyles.items}>
        {repeat(3, (index) => (
          <div className={pointsStyles.item} key={index}>
            <Bone height={38} round />
            <div>
              <TextBone size={12} width={pick(["48%", "60%", "40%"], index)} />
              <TextBone size={10} width="86%" lineHeight={1.4} />
              <TextBone size={10} width={46} />
            </div>
            <Bone width={74} height={32} pill />
          </div>
        ))}
      </div>

      <h2 className={pointsStyles.sectionTitle}>History</h2>
      <div className={pointsStyles.history}>
        {repeat(3, (index) => (
          <div key={index}>
            <div className={sk.lines}><TextBone size={11} width={pick(["46%", "38%", "52%"], index)} /><TextBone size={9} width={40} /></div>
            <TextBone size={12} width={24} />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}

export function FacultyDirectorySkeleton() {
  return (
    <SkeletonScreen className={directory.screen} pageClassName={directory.page} role="student" activeNav="faculty">
      <header className={directory.header}><BrandLogo /><StaticBell /></header>
      <PageHeading title="Book a Consultation" subtitle="Choose an available faculty member for your consultation." />
      <TabsSkeleton labels={["All Faculty", "Available"]} packed />
      <ul className={sk.rows}>
        {repeat(5, (index) => (
          <li className={sk.row} key={index}>
            <Bone height={44} round />
            <div className={sk.lines}>
              <TextBone size={14} width={pick(["62%", "50%", "70%"], index)} />
              <TextBone size={12} width={pick(["44%", "56%", "38%"], index)} />
            </div>
            <div className={sk.trailing}><TextBone size={12} width={64} /><TextBone size={11} width={44} /></div>
            <ChevronRight className={sk.chevron} size={16} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </SkeletonScreen>
  );
}

export function ProfileSkeleton({ role }: { role: Role }) {
  return (
    <SkeletonScreen className={profileStyles.screen} role={role} activeNav="profile">
      <ProfileOverviewSkeleton role={role} />
    </SkeletonScreen>
  );
}

const personalInfoFields = {
  student: [
    { icon: UserRound, label: "Full Name" },
    { icon: IdCard, label: "Student ID" },
    { icon: GraduationCap, label: "Course and Year" },
  ],
  faculty: [
    { icon: UserRound, label: "Full Name" },
    { icon: IdCard, label: "Faculty ID" },
    { icon: Building2, label: "Department" },
    { icon: Mail, label: "Email" },
  ],
};

export function PersonalInfoScreenSkeleton({ role }: { role: Role }) {
  return (
    <SkeletonScreen className={profileStyles.screen} backTo={`/${role}/profile`} role={role} activeNav="profile">
      <PersonalInfoSkeleton fields={personalInfoFields[role]} editHref={`/${role}/profile/edit`} />
    </SkeletonScreen>
  );
}

export function ProfileEditSkeleton({ role }: { role: Role }) {
  const labels = role === "faculty" ? ["Full Name", "School Email", "Department"] : ["Full Name", "Course and Year"];
  return (
    <SkeletonScreen className={settings.screen} pageClassName={settings.page} backTo={`/${role}/profile/info`} role={role} activeNav="profile">
      <PageHeading title="Edit Profile" subtitle="Update the information shown in your portal." />
      <div className={settings.photoEditor}><Bone height={76} round center style={{ marginBottom: 14 }} /></div>
      <div className={settings.form}>{labels.map((label) => <FieldSkeleton key={label} label={label} />)}</div>
      <div className={settings.submitArea}><DisabledButton label="Save Changes" /></div>
    </SkeletonScreen>
  );
}

export function BadgesSkeleton({ role }: { role: Role }) {
  return (
    <SkeletonScreen className={settings.screen} pageClassName={settings.page} backTo={`/${role}/profile`} role={role} activeNav="profile">
      <PageHeading title="Badges" subtitle="Earn badges as you use Teech. Show up to 3 on your profile." />
      <div className={badgeStyles.progress}>
        <div><TextBone size={12} width={92} /><TextBone size={12} width={28} /></div>
        <div className={badgeStyles.progressTrack} />
      </div>
      <div className={badgeStyles.section}>
        <div className={badgeStyles.group}>
          <TextBone size={11} width={72} />
          <ul className={badgeStyles.list}>
            {repeat(5, (index) => (
              <li className={badgeStyles.row} key={index}>
                <Bone height={40} round />
                <div className={sk.lines}>
                  <TextBone size={14} width={pick(["46%", "58%", "38%"], index)} />
                  <TextBone size={12} width={pick(["82%", "70%", "90%"], index)} lineHeight={1.4} />
                </div>
                <Bone width={72} height={30} pill />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SkeletonScreen>
  );
}

export function StudentSecuritySkeleton() {
  return (
    <SkeletonScreen className={settings.screen} pageClassName={settings.page} backTo="/student/profile" role="student" activeNav="profile">
      <PageHeading title="Account Recovery" subtitle="Security questions let you reset your password if you forget it." />
      <Bone width={150} height={28} pill center style={{ marginTop: 4 }} />
      <ol className={studentSecurity.questions}>
        {repeat(3, (index) => (
          <li key={index}>
            <span className={studentSecurity.step} aria-hidden="true">{index + 1}</span>
            <div className={studentSecurity.pair}>
              <div className={sk.pairRow}><TextBone size={14} width={pick(["76%", "64%", "82%"], index)} /></div>
              <div className={sk.pairRow}><TextBone size={14} width="34%" /></div>
            </div>
          </li>
        ))}
      </ol>
      <p className={studentSecurity.hint}><Info size={13} aria-hidden="true" />Answers aren&apos;t case-sensitive. Pick ones only you would know.</p>
      <div className={studentSecurity.confirm}>
        <label className={ui.field}><span>Confirm it&apos;s you</span><Bone width="100%" height={48} radius={14} /></label>
      </div>
      <div className={studentSecurity.submit}><DisabledButton label="Save questions" /></div>
      <SignOutEverywhere />
    </SkeletonScreen>
  );
}

export function FacultySecuritySkeleton() {
  return (
    <SkeletonScreen className={settings.screen} pageClassName={settings.page} backTo="/faculty/profile" role="faculty" activeNav="profile">
      <PageHeading title="Account Recovery" subtitle="How you get back into your account if you forget your password." />
      <section className={settings.securityCard}>
        <h2><Mail size={15} />Recovery email</h2>
        <TextBone size={13} width={190} />
        <p>If you forget your password, tap <b>Forgot Password</b> on the sign-in screen and we&apos;ll email a reset link to this address.</p>
        <Link className={settings.textAction} href="/faculty/profile/edit">Change email</Link>
      </section>
      <SignOutEverywhere />
    </SkeletonScreen>
  );
}

export function GenericSkeleton({ backTo, role, activeNav }: { backTo?: string; role?: Role; activeNav?: string }) {
  return (
    <SkeletonScreen backTo={backTo} role={role} activeNav={activeNav}>
      <HeadingSkeleton titleWidth={180} subtitleWidth={240} />
      <div className={sk.blocks}>{repeat(3, (index) => <Bone key={index} width="100%" height={72} radius={12} />)}</div>
    </SkeletonScreen>
  );
}
