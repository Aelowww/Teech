import type { CSSProperties } from "react";
import { PageHeading } from "./ui";
import { BookingSteps } from "./booking-steps";
import ui from "./ui.module.css";
import booking from "./booking.module.css";
import fact from "./fact-card.module.css";
import streak from "./login-streak.module.css";
import tabs from "./request-tabs.module.css";
import overview from "./profile-overview.module.css";
import badges from "./badge-grid.module.css";
import info from "./personal-info.module.css";
import settings from "./profile-settings.module.css";
import points from "./points-shop.module.css";
import feed from "./notifications-feed.module.css";
import studentHome from "@/app/desktop/student/home/page.module.css";
import facultyHome from "@/app/desktop/faculty/home/page.module.css";
import directory from "@/app/desktop/student/faculty/page.module.css";
import studentRequests from "@/app/desktop/student/appointment-requests/page.module.css";
import facultyRequests from "@/app/desktop/faculty/requests/page.module.css";
import detail from "@/app/desktop/student/appointment-requests/[id]/page.module.css";
import facultyCalendar from "@/app/desktop/faculty/calendar/page.module.css";
import availability from "@/app/desktop/faculty/availability/page.module.css";
import details from "@/app/desktop/student/appointment-info/page.module.css";
import s from "./app-loader.module.css";

export type SkeletonRole = "student" | "faculty";

/* ---------- Primitives ---------- */

function Bone({ w, h = 14, r = 7, className }: { w?: number | string; h?: number; r?: number; className?: string }) {
  return <span className={`${s.bone} ${className || ""}`} style={{ width: w ?? "100%", height: h, borderRadius: r } as CSSProperties} />;
}

function Lines({ widths, h = 13, className }: { widths: (number | string)[]; h?: number; className?: string }) {
  return <span className={`${s.lines} ${className || ""}`}>{widths.map((width, index) => <Bone key={index} w={width} h={index === 0 ? h + 2 : h} />)}</span>;
}

function times(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

/* ---------- Shared shells (same classes as the real components) ---------- */

function TipShell() {
  return (
    <div className={`${fact.card} ${fact.compact}`}>
      <span className={s.lines}>
        <span className={s.row}><Bone w={32} h={32} r={10} /><Bone w={96} h={22} r={11} /><Bone w={82} h={28} r={14} className={s.end} /></span>
        <Bone w="95%" /><Bone w="88%" /><Bone w="60%" />
        <Bone w={120} h={6} r={3} />
      </span>
    </div>
  );
}

function UpNextShell() {
  return (
    <div className={ui.upNext}>
      <span className={ui.upNextTop}><Bone w={70} h={12} /><Bone w={86} h={24} r={12} /></span>
      <span className={ui.upNextBody}>
        <Bone w={88} h={88} r={44} />
        <span className={s.lines}><Bone w="45%" h={28} r={8} /><span className={s.row}><Bone w={96} h={30} r={15} /><Bone w={96} h={30} r={15} /></span></span>
        <Bone w={84} h={96} r={18} />
      </span>
      <span className={ui.upNextFooter}><Bone w={170} h={14} /><Bone w={140} h={40} r={20} /></span>
    </div>
  );
}

function ListCards({ count }: { count: number }) {
  return (
    <div className={ui.list}>
      {times(count).map((index) => (
        <div key={index} className={ui.listCard}>
          <Bone w={40} h={40} r={20} />
          <Lines widths={["55%", "80%"]} />
          <Bone w={16} h={16} r={4} />
        </div>
      ))}
    </div>
  );
}

function StreakShell() {
  return (
    <div className={streak.card}>
      <div className={streak.summary}>
        <Bone w={44} h={44} r={22} />
        <Lines widths={["60%", "85%"]} />
        <Bone w={72} h={32} r={16} />
      </div>
      <div className={s.week}>{times(7).map((index) => <span key={index} className={s.day}><Bone w={12} h={10} /><Bone w={32} h={32} r={16} /><Bone w={22} h={10} /></span>)}</div>
      <Bone h={36} r={12} />
      <Bone h={40} r={20} />
    </div>
  );
}

function SectionTitle({ w = 190 }: { w?: number }) {
  return <Bone w={w} h={20} r={8} />;
}

function Tabs({ count = 4 }: { count?: number }) {
  return <div className={tabs.tabs}>{times(count).map((index) => <span key={index} className={s.tab}><Bone w={[56, 70, 84, 60][index % 4]} h={15} /><Bone w={22} h={22} r={11} /></span>)}</div>;
}

function Calendar() {
  return (
    <div className={ui.calendar}>
      <div className={ui.calendarHeader}><Bone w={38} h={38} r={19} /><Bone w={150} h={20} /><Bone w={38} h={38} r={19} /></div>
      <div className={ui.legend}><Bone w={120} h={13} /></div>
      <div className={ui.calendarGrid}>
        {times(7).map((index) => <Bone key={`w${index}`} w={14} h={13} />)}
        {times(35).map((index) => <Bone key={index} w={46} h={46} r={23} />)}
      </div>
    </div>
  );
}

function BookingSide({ rows }: { rows: number }) {
  return (
    <aside className={booking.side}>
      <h2>Your consultation</h2>
      <div className={booking.summaryList}>{times(rows).map((index) => <Bone key={index} h={62} r={14} />)}</div>
      <Bone h={44} r={22} />
    </aside>
  );
}

function SettingsCard({ title, subtitle, fields }: { title: string; subtitle?: string; fields: number }) {
  return (
    <div className={settings.page}>
      <PageHeading title={title} subtitle={subtitle} />
      {!subtitle && <Bone w={360} h={14} className={s.subtitle} />}
      <div className={s.fields}>{times(fields).map((index) => <span key={index} className={s.lines}><Bone w={110} h={12} /><Bone h={50} r={12} /></span>)}</div>
      <Bone w={180} h={44} r={22} className={s.end} />
    </div>
  );
}

/* ---------- Pages ---------- */

function StudentHome() {
  return (
    <div className={studentHome.dashboard}>
      <header className={studentHome.header}>
        <div className={studentHome.greeting}><Bone w={64} h={64} r={32} /><Lines widths={[110, 220]} h={14} /></div>
        <Bone w={196} h={44} r={22} />
      </header>
      <div className={studentHome.layout}>
        <div className={studentHome.main}>
          <UpNextShell />
          <section className={studentHome.section}><SectionTitle /><ListCards count={2} /></section>
        </div>
        <aside className={studentHome.rail}>
          <StreakShell />
          <section className={studentHome.overview}>
            <Bone w="45%" h={16} />
            <Bone h={8} r={4} />
            {times(3).map((index) => <span key={index} className={s.between}><Bone w={96} h={13} /><Bone w={18} h={16} /></span>)}
            <Bone w={130} h={14} />
          </section>
          <TipShell />
        </aside>
      </div>
    </div>
  );
}

function FacultyHome() {
  return (
    <div className={s.stack28}>
      <header className={facultyHome.header}>
        <div className={facultyHome.greeting}><Bone w={64} h={64} r={32} /><Lines widths={[110, 220]} h={14} className={s.noGrow} /><Bone w={120} h={34} r={17} className={s.presenceBone} /></div>
      </header>
      <div className={facultyHome.layout}>
        <div className={facultyHome.main}>
          <section className={facultyHome.schedule}>
            <div className={facultyHome.scheduleHead}>
              <span className={s.lines}><Bone w={110} h={12} /><Bone w={320} h={28} r={8} /><Bone w={280} h={14} /></span>
              <Bone w={210} h={44} r={22} />
            </div>
            <div className={facultyHome.scheduleStats}>
              {times(3).map((index) => (
                <div key={index} className={`${facultyHome.stat} ${s.static}`}>
                  <Bone w={40} h={40} r={12} className={s.infoIcon} />
                  <Bone w={70} h={20} r={6} />
                  <Bone w={90} h={12} />
                </div>
              ))}
            </div>
          </section>
          <section className={facultyHome.section}><SectionTitle w={220} /><ListCards count={2} /></section>
        </div>
        <aside className={facultyHome.rail}>
          <StreakShell />
          <TipShell />
        </aside>
      </div>
    </div>
  );
}

function FacultyDirectory() {
  return (
    <div className={directory.page}>
      <header className={directory.header}>
        <div className={directory.heading}><PageHeading title="Book a Consultation" subtitle="Choose an available faculty member for your consultation." /></div>
        <div className={directory.filters}><span className={s.tab}><Bone w={84} h={15} /><Bone w={22} h={22} r={11} /></span><span className={s.tab}><Bone w={70} h={15} /><Bone w={22} h={22} r={11} /></span></div>
      </header>
      <ul className={directory.grid}>
        {times(8).map((index) => (
          <li key={index}>
            <div className={`${directory.card} ${s.static}`}>
              <Bone w={88} h={88} r={44} />
              <span className={s.centerLines}><Bone w={120} h={17} /><Bone w={60} h={13} /></span>
              <Bone w={78} h={22} r={11} />
              <Bone w={150} h={13} />
              <Bone h={40} r={20} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StudentRequests() {
  return (
    <div className={studentRequests.page}>
      <PageHeading title="Requests" subtitle="Manage your consultation requests." />
      <Tabs />
      <ul className={studentRequests.list}>
        {times(6).map((index) => (
          <li key={index}>
            <div className={`${studentRequests.row} ${s.static}`}>
              <Bone w={52} h={52} r={26} />
              <Lines widths={["50%", "65%", "40%"]} />
              <Bone w={78} h={22} r={11} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FacultyRequests() {
  return (
    <div className={facultyRequests.page}>
      <PageHeading title="Requests" subtitle="Approve or decline student consultation requests." />
      <Tabs />
      <div className={facultyRequests.table}>
        <div className={facultyRequests.head}>{["Student", "Reason", "When", "Status", ""].map((label) => <span key={label}>{label}</span>)}</div>
        {times(5).map((index) => (
          <div key={index} className={facultyRequests.row}>
            <span className={facultyRequests.student}><Bone w={44} h={44} r={22} /><Lines widths={[140, 70]} /></span>
            <Bone w="70%" h={14} />
            <Lines widths={[100, 60]} />
            <Bone w={76} h={22} r={11} />
            <span className={s.endRow}><Bone w={78} h={30} r={15} /><Bone w={84} h={30} r={15} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestDetail() {
  return (
    <div className={detail.page}>
      <aside className={detail.statusCard}>
        <span className={s.centerLines}><Bone w={64} h={64} r={32} /><Bone w="75%" h={26} r={8} /><Bone w="90%" h={13} /><Bone w="60%" h={13} /></span>
        <span className={s.timeline}>{times(3).map((index) => <span key={index} className={s.centerLines}><Bone w={20} h={20} r={10} /><Bone w={56} h={12} /></span>)}</span>
        <span className={s.centerLines}><Bone w={170} h={16} /></span>
      </aside>
      <section className={detail.infoCard}>
        <div className={detail.faculty}><Bone w={56} h={56} r={28} /><Lines widths={[180, 130]} /></div>
        <div className={s.tiles}>
          <Bone h={82} r={16} />
          <Bone h={82} r={16} />
          <Bone h={110} r={16} className={s.full} />
          <Bone h={82} r={16} />
        </div>
      </section>
    </div>
  );
}

function BookingDate() {
  return (
    <div className={s.block}>
      <BookingSteps current={1} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading title="Choose a date" />
          <Bone w={300} h={14} className={s.subtitle} />
          <Calendar />
        </section>
        <BookingSide rows={3} />
      </div>
    </div>
  );
}

function BookingTime() {
  return (
    <div className={s.block}>
      <BookingSteps current={2} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading title="Choose a time" />
          <Bone w={160} h={14} className={s.subtitle} />
          <div className={ui.availabilityForm}>
            {times(2).map((group) => (
              <section key={group} className={ui.slotGroup}>
                <span className={s.slotLabel}><Bone w={90} h={14} /><Bone w={52} h={18} r={9} /></span>
                {times(4).map((index) => <Bone key={index} h={48} r={24} />)}
              </section>
            ))}
          </div>
        </section>
        <BookingSide rows={4} />
      </div>
    </div>
  );
}

function BookingDetails() {
  return (
    <div className={s.block}>
      <BookingSteps current={3} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading title="Appointment Information" subtitle="Enter the details for your consultation request." />
          <div className={details.identity}>
            <Bone w={44} h={44} r={22} />
            <Lines widths={[90, 150]} />
            <span className={s.row}><Lines widths={[70, 60]} /><Lines widths={[100, 60]} /></span>
          </div>
          <div className={details.form}>
            <span className={s.lines}><Bone w={170} h={14} /><Bone h={50} r={14} /></span>
            <span className={s.lines}><Bone w={140} h={14} /><Bone h={150} r={14} /></span>
          </div>
        </section>
        <BookingSide rows={4} />
      </div>
    </div>
  );
}

function BookingReview() {
  return (
    <div className={s.block}>
      <BookingSteps current={4} />
      <div className={booking.layout}>
        <section className={booking.main}>
          <PageHeading title="Review Appointment" subtitle="Review the information you entered before submitting." />
          <div className={s.reviewList}>{times(7).map((index) => <span key={index} className={s.between}><Bone w={140} h={13} /><Bone w={`${30 + (index % 3) * 12}%`} h={15} /></span>)}</div>
        </section>
        <aside className={booking.side}><Bone h={44} r={22} /><Bone h={44} r={22} /></aside>
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div className={overview.page}>
      <h1 className={overview.title}>My Profile</h1>
      <div className={overview.layout}>
        <aside className={overview.identity}>
          <div className={overview.cover} />
          <Bone w={104} h={104} r={52} className={s.profilePhoto} />
          <span className={s.centerLines}><Bone w={170} h={24} r={8} /><Bone w={100} h={13} /></span>
          <span className={`${s.row} ${s.chipRow}`}><Bone w={60} h={24} r={12} /><Bone w={86} h={24} r={12} /></span>
          <span className={overview.badges}><Bone w={140} h={11} /><span className={s.row}>{times(2).map((index) => <Bone key={index} w={38} h={38} r={19} />)}</span></span>
          <span className={overview.signOut}><Bone h={44} r={22} /></span>
        </aside>
        <div className={overview.content}>
          <section className={overview.infoCard}>
            <span className={s.between}><Bone w={190} h={18} /><Bone w={80} h={36} r={18} /></span>
            <div className={overview.details}>{times(4).map((index) => <Bone key={index} h={72} r={14} />)}</div>
          </section>
          <div className={overview.groups}>
            {times(2).map((index) => (
              <section key={index} className={overview.group}>
                <Bone w={140} h={12} />
                <div className={s.settingRows}>{times(3).map((row) => <span key={row} className={s.between}><span className={s.row}><Bone w={18} h={18} r={5} /><Bone w={150} h={14} /></span><Bone w={14} h={14} r={4} /></span>)}</div>
              </section>
            ))}
          </div>
          <section className={overview.dangerZone}><Lines widths={[130, 380]} /><Bone w={170} h={42} r={21} /></section>
        </div>
      </div>
    </div>
  );
}

function Badges() {
  return (
    <div className={badges.page}>
      <header className={badges.header}>
        <div className={badges.heading}><PageHeading title="Badges" /><Bone w={360} h={14} className={s.subtitle} /></div>
        <div className={badges.progress}><span className={s.between}><Bone w={110} h={15} /><Bone w={36} h={14} /></span><Bone h={8} r={4} /><Bone w={170} h={11} /></div>
      </header>
      <section className={badges.section}>
        {[2, 8].map((count, group) => (
          <div key={group} className={badges.group}>
            <Bone w={100} h={14} className={s.groupLabel} />
            <ul className={badges.list}>
              {times(count).map((index) => (
                <li key={index} className={badges.tile}>
                  <Bone w={60} h={60} r={30} />
                  <span className={s.centerLines}><Bone w={110} h={15} /><Bone w={150} h={12} /></span>
                  <Bone w={group === 0 ? 140 : 80} h={group === 0 ? 32 : 24} r={16} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function PersonalInfo({ role }: { role: SkeletonRole }) {
  return (
    <div className={info.page}>
      <header className={info.header}>
        <div className={info.heading}><PageHeading title="Personal Information" subtitle="The details shown in your portal." /></div>
        <Bone w={140} h={44} r={22} />
      </header>
      <dl className={info.list}>
        {times(role === "faculty" ? 4 : 3).map((index) => (
          <div key={index} className={info.row}>
            <Bone w={44} h={44} r={14} className={s.infoIcon} />
            <Bone w={90} h={11} />
            <Bone w="70%" h={17} />
          </div>
        ))}
      </dl>
    </div>
  );
}

function Points() {
  return (
    <>
      <PageHeading title="Points & Rewards" subtitle="Earn points by showing up. Spend them on rewards." />
      <div className={points.page}>
        <div className={points.mainColumn}>
          <Bone h={168} r={20} />
          <section className={points.rewards}>
            <h2 className={points.sectionTitle}>Rewards</h2>
            <div className={points.items}>
              {times(4).map((index) => (
                <article key={index} className={points.item}>
                  <Bone w={48} h={48} r={14} />
                  <Lines widths={["55%", "85%"]} />
                  <span className={s.endLines}><Bone w={64} h={14} /><Bone w={84} h={32} r={16} /></span>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className={points.sideColumn}>
          <section className={points.panel}>
            <h2 className={points.sectionTitle}>History</h2>
            <div className={s.history}>{times(6).map((index) => <span key={index} className={s.between}><Lines widths={[150, 60]} /><Bone w={28} h={15} /></span>)}</div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Notifications() {
  return (
    <div className={feed.page}>
      <PageHeading title="Notifications" subtitle="Stay updated on your account and consultations." />
      <div className={feed.toolbar}><Bone w={80} h={14} /><Bone w={130} h={14} /></div>
      <div className={feed.updates}>
        {[3, 3].map((count, group) => (
          <section key={group}>
            <Bone w={70} h={12} className={s.groupLabel} />
            <div className={feed.groupList}>
              {times(count).map((index) => (
                <div key={index} className={`${feed.item} ${s.static}`}>
                  <Bone w={40} h={40} r={12} />
                  <span className={s.lines}><span className={s.between}><Bone w="45%" h={15} /><Bone w={50} h={11} /></span><Bone w="85%" h={13} /></span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FacultyCalendar() {
  return (
    <>
      <PageHeading title="Calendar" subtitle="Your published consultation dates." />
      <div className={facultyCalendar.page}>
        <Calendar />
        <aside className={facultyCalendar.side}>
          <section className={facultyCalendar.summary}><Bone w={48} h={48} r={14} /><Lines widths={["70%", "90%"]} /></section>
          <Bone h={50} r={25} />
        </aside>
      </div>
    </>
  );
}

function Availability() {
  return (
    <>
      <PageHeading title="Availability" subtitle="Choose specific dates and times students can request." />
      <div className={availability.page}>
        <Calendar />
        <aside className={availability.side}>
          <section className={availability.editor}>
            <Bone w="70%" h={15} />
            <span className={s.tiles}><span className={s.lines}><Bone w={70} h={12} /><Bone h={46} r={12} /></span><span className={s.lines}><Bone w={70} h={12} /><Bone h={46} r={12} /></span></span>
            <span className={s.lines}><Bone w={170} h={12} /><Bone h={46} r={12} /></span>
          </section>
          <Bone h={44} r={22} />
        </aside>
      </div>
    </>
  );
}

function Legal() {
  return (
    <div className={settings.page}>
      <Bone w={260} h={32} r={10} />
      <Bone w={380} h={14} className={s.subtitle} />
      {times(4).map((index) => <span key={index} className={s.lines}><Bone w={200} h={18} /><Bone w="96%" /><Bone w="92%" /><Bone w="64%" /></span>)}
    </div>
  );
}

function RequestSubmitted() {
  return (
    <div className={`${settings.page} ${s.centerLines}`}>
      <Bone w={96} h={96} r={48} />
      <PageHeading title="Request Submitted" subtitle="Your consultation request has been sent to the faculty member." />
      <span className={s.lines}>{times(3).map((index) => <Bone key={index} w="80%" h={14} />)}</span>
      <span className={s.row}><Bone w={170} h={44} r={22} /><Bone w={170} h={44} r={22} /></span>
    </div>
  );
}

/* ---------- Route → skeleton ---------- */

const bookingSteps: Record<string, () => React.ReactNode> = {
  calendar: BookingDate,
  "select-date-time": BookingTime,
  "appointment-info": BookingDetails,
  "appointment-review": BookingReview,
};

export function PageSkeleton({ role, path }: { role: SkeletonRole; path: string[] }) {
  const [page, sub] = path;
  if (!page || page === "home") return role === "faculty" ? <FacultyHome /> : <StudentHome />;
  if (role === "student" && page === "faculty") return <FacultyDirectory />;
  if (role === "student" && bookingSteps[page]) return bookingSteps[page]();
  if (role === "student" && page === "request-submitted") return <RequestSubmitted />;
  if (page === "appointment-requests" || page === "requests") {
    if (sub) return <RequestDetail />;
    return role === "faculty" ? <FacultyRequests /> : <StudentRequests />;
  }
  if (page === "calendar") return <FacultyCalendar />;
  if (page === "availability") return <Availability />;
  if (page === "points") return <Points />;
  if (page === "notifications") return <Notifications />;
  if (page === "profile") {
    if (!sub) return <Profile />;
    if (sub === "badges") return <Badges />;
    if (sub === "info") return <PersonalInfo role={role} />;
    if (sub === "edit") return <SettingsCard title="Edit Profile" subtitle="Update the information shown in your portal." fields={4} />;
    if (sub === "password") return <SettingsCard title="Change Password" subtitle="Choose a new password for your account." fields={2} />;
    if (sub === "security") return <SettingsCard title="Account Recovery" fields={4} />;
    return <Legal />;
  }
  return <Legal />;
}
