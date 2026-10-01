"use client";

<<<<<<< HEAD
=======
import Image from "next/image";
import type { CSSProperties } from "react";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { Backdrop } from "./backdrop";
import styles from "./app-loader.module.css";

type Role = "student" | "faculty";
<<<<<<< HEAD
type Layout = "dashboard" | "facultyGrid" | "requestList" | "requestDetail" | "booking" | "calendar" | "profile" | "panel" | "inbox" | "points" | "confirmation";
=======
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4

const guestPages = ["sign-in", "create-account", "forgot-password", "password-reset", "account-created"];
const bookingPages = ["calendar", "select-date-time", "appointment-info", "appointment-review"];

<<<<<<< HEAD
=======
const loadingMessages = [
  "Getting things ready…",
  "Syncing your schedule…",
  "Checking the latest updates…",
  "Tip: check in daily to keep your streak",
];

>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
export function AppLoader() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "desktop" || parts[0] === "mobile") parts.shift();
  const [first, ...rest] = parts;
  const role: Role | null = first === "student" || first === "faculty" ? first : null;

<<<<<<< HEAD
  if (!role || guestPages.includes(rest[0])) return <GuestSkeleton />;

  const { layout, active } = layoutFor(role, rest);
  return (
    <AppShell role={role} active={active}>
      <div className={styles.content} aria-busy="true" aria-live="polite">
        <span className={styles.srOnly}>Loading…</span>
        {skeletons[layout]()}
=======
  if (!role || guestPages.includes(rest[0])) {
    return (
      <main className={styles.guest}>
        <Backdrop />
        <Logo />
      </main>
    );
  }

  return (
    <AppShell role={role} active={activeFor(role, rest[0])}>
      <div className={styles.content}>
        <Logo />
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
      </div>
    </AppShell>
  );
}

<<<<<<< HEAD
function layoutFor(role: Role, rest: string[]): { layout: Layout; active: string } {
  const [page, sub] = rest;
  if (page === "home" || !page) return { layout: "dashboard", active: "home" };
  if (page === "faculty") return { layout: "facultyGrid", active: "faculty" };
  if (page === "appointment-requests" || page === "requests") return { layout: sub ? "requestDetail" : "requestList", active: "requests" };
  if (page === "request-submitted") return { layout: "confirmation", active: "requests" };
  if (role === "student" && bookingPages.includes(page)) return { layout: "booking", active: "faculty" };
  if (page === "calendar" || page === "availability") return { layout: "calendar", active: "calendar" };
  if (page === "notifications") return { layout: "inbox", active: "notifications" };
  if (page === "points") return { layout: "points", active: "points" };
  if (page === "profile") return { layout: sub ? "panel" : "profile", active: "profile" };
  return { layout: "panel", active: "" };
}

function Bone({ w = "100%", h = 14, r = 8, className }: { w?: number | string; h?: number | string; r?: number; className?: string }) {
  return <span className={`${styles.bone} ${className || ""}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

function Heading() {
  return (
    <div className={styles.heading}>
      <Bone w={260} h={30} r={10} />
      <Bone w={420} h={14} />
    </div>
  );
}

function Card({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className || ""}`}>{children}</div>;
}

function Lines({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.stack}>
      {Array.from({ length: count }, (_, index) => <Bone key={index} w={`${90 - index * 15}%`} />)}
    </div>
  );
}

function Row() {
  return (
    <Card className={styles.row}>
      <Bone w={48} h={48} r={24} />
      <div className={styles.stack}><Bone w="45%" h={16} /><Bone w="30%" h={12} /></div>
      <Bone w={130} h={14} />
      <Bone w={86} h={26} r={13} />
      <Bone w={96} h={40} r={20} />
    </Card>
  );
}

function SidePanel({ rows = 3 }: { rows?: number }) {
  return (
    <Card className={styles.side}>
      <Bone w="55%" h={18} />
      {Array.from({ length: rows }, (_, index) => <Bone key={index} h={56} r={14} />)}
      <Bone h={52} r={26} />
    </Card>
  );
}

function Calendar() {
  return (
    <Card>
      <div className={styles.calendarHeader}><Bone w={38} h={38} r={19} /><Bone w={160} h={20} /><Bone w={38} h={38} r={19} /></div>
      <div className={styles.calendarGrid}>
        {Array.from({ length: 35 }, (_, index) => <Bone key={index} w={46} h={46} r={23} />)}
      </div>
    </Card>
  );
}

const skeletons: Record<Layout, () => React.ReactNode> = {
  dashboard: () => (
    <>
      <div className={styles.headerRow}>
        <div className={styles.inline}>
          <Bone w={64} h={64} r={32} />
          <div className={styles.stack}><Bone w={110} h={14} /><Bone w={220} h={26} r={8} /></div>
          <Bone w={40} h={40} r={20} />
        </div>
        <Bone w={190} h={44} r={22} />
      </div>
      <div className={styles.homeTop}>
        <Card className={styles.stack}>
          <div className={styles.headerRow}><Bone w={80} h={12} /><Bone w={70} h={24} r={12} /></div>
          <div className={styles.inline}><Bone w={56} h={56} r={28} /><div className={styles.grow}><Bone w="55%" h={22} r={8} /><Bone w="75%" h={14} /></div></div>
        </Card>
        <Card className={styles.stack}>
          <div className={styles.inline}><Bone w={44} h={44} r={22} /><div className={styles.grow}><Lines count={2} /></div><Bone w={70} h={30} r={15} /></div>
          <div className={styles.week}>{Array.from({ length: 7 }, (_, index) => <Bone key={index} w={32} h={32} r={16} />)}</div>
        </Card>
      </div>
      <Bone w={200} h={18} />
      <div className={styles.cardGrid}>
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className={styles.inline}><Bone w={44} h={44} r={22} /><div className={styles.grow}><Bone w="55%" h={15} /><Bone w="75%" h={12} /><Bone w={64} h={20} r={10} /></div></Card>
        ))}
      </div>
    </>
  ),

  facultyGrid: () => (
    <>
      <Heading />
      <Card className={styles.toolbar}><Bone w={420} h={46} r={23} /><Bone w={220} h={46} r={23} /></Card>
      <div className={styles.grid}>
        {Array.from({ length: 8 }, (_, index) => (
          <Card key={index} className={styles.profileCard}>
            <Bone w={80} h={80} r={40} />
            <Bone w="60%" h={16} />
            <Bone w="80%" h={12} />
            <Bone w={90} h={24} r={12} />
            <Bone h={46} r={23} />
          </Card>
        ))}
      </div>
    </>
  ),

  requestList: () => (
    <>
      <Heading />
      <Bone w={420} h={52} r={16} className={styles.spaced} />
      <div className={styles.stack12}>{Array.from({ length: 5 }, (_, index) => <Row key={index} />)}</div>
    </>
  ),

  requestDetail: () => (
    <div className={styles.detail}>
      <Card className={styles.centered}>
        <Bone w={80} h={80} r={40} />
        <Bone w="70%" h={24} />
        <Bone w="85%" h={14} />
        <div className={styles.inline}>{[0, 1, 2].map((index) => <Bone key={index} w={32} h={32} r={16} />)}</div>
        <Bone h={48} r={24} />
      </Card>
      <Card className={styles.flush}>
        <div className={styles.band}><Bone w={140} h={14} /><Bone w={180} h={18} /></div>
        <div className={styles.padded}>
          <div className={styles.inline}><Bone w={56} h={56} r={28} /><div className={styles.grow}><Lines count={2} /></div></div>
          <div className={styles.stats}>{[0, 1, 2].map((index) => <Bone key={index} h={84} r={16} />)}</div>
          <Lines count={3} />
        </div>
      </Card>
    </div>
  ),

  booking: () => (
    <>
      <Bone h={64} r={20} className={styles.spaced} />
      <div className={styles.twoColumn}>
        <Card><Heading /><div className={styles.calendarGrid}>{Array.from({ length: 35 }, (_, index) => <Bone key={index} w={46} h={46} r={23} />)}</div></Card>
        <SidePanel />
      </div>
    </>
  ),

  calendar: () => (
    <>
      <Heading />
      <div className={styles.twoColumn}>
        <Calendar />
        <SidePanel rows={2} />
      </div>
    </>
  ),

  profile: () => (
    <>
      <Heading />
      <div className={styles.profile}>
        <Card className={styles.centered}>
          <Bone w={112} h={112} r={56} />
          <Bone w="60%" h={20} />
          <Bone w="35%" h={14} />
          <Bone h={50} r={25} />
        </Card>
        <div className={styles.stack24}>
          {[2, 2, 3].map((count, group) => (
            <div key={group} className={styles.stack}>
              <Bone w={120} h={12} />
              <Card className={styles.flush}>{Array.from({ length: count }, (_, index) => <div key={index} className={styles.settingRow}><Bone w={20} h={20} r={6} /><Bone w="35%" h={15} /></div>)}</Card>
            </div>
          ))}
        </div>
      </div>
    </>
  ),

  panel: () => (
    <Card className={styles.panel}>
      <Heading />
      <div className={styles.fields}>{Array.from({ length: 4 }, (_, index) => <div key={index} className={styles.stack}><Bone w={110} h={12} /><Bone h={52} r={14} /></div>)}</div>
      <div className={styles.panelFooter}><Bone w={220} h={50} r={25} /></div>
    </Card>
  ),

  inbox: () => (
    <div className={styles.inbox}>
      <Heading />
      <Card className={styles.flush}>
        <div className={styles.band}><Bone w={100} h={14} /><Bone w={150} h={36} r={18} /></div>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={styles.inboxRow}><Bone w={42} h={42} r={21} /><div className={styles.grow}><Bone w="40%" h={15} /><Bone w="75%" h={13} /><Bone w={90} h={11} /></div></div>
        ))}
      </Card>
    </div>
  ),

  points: () => (
    <>
      <Heading />
      <div className={styles.twoColumn}>
        <div className={styles.stack24}>
          <Bone h={124} r={20} />
          <Bone w={120} h={20} />
          <div className={styles.grid}>{Array.from({ length: 4 }, (_, index) => <Card key={index} className={styles.stack}><Bone w={48} h={48} r={14} /><Bone w="60%" h={16} /><Lines count={2} /><Bone h={44} r={22} /></Card>)}</div>
        </div>
        <div className={styles.stack24}>
          <Card className={styles.stack}><Bone w="50%" h={18} /><Bone h={52} r={14} /><Bone h={52} r={14} /></Card>
          <Card className={styles.stack}><Bone w="40%" h={18} /><Lines count={4} /></Card>
        </div>
      </div>
    </>
  ),

  confirmation: () => (
    <Card className={`${styles.centered} ${styles.confirmation}`}>
      <Bone w={96} h={96} r={48} />
      <Bone w="50%" h={28} r={10} />
      <Bone w="70%" h={14} />
      <div className={styles.stats}>{[0, 1, 2].map((index) => <Bone key={index} h={110} r={16} />)}</div>
      <div className={styles.inline}><Bone w={200} h={50} r={25} /><Bone w={180} h={50} r={25} /></div>
    </Card>
  ),
};

function GuestSkeleton() {
  return (
    <main className={styles.guest} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading…</span>
      <Backdrop />
      <div className={styles.guestContent}>
        <Bone w={320} h={40} r={12} />
        <Bone w={200} h={16} />
        <div className={styles.guestCard}>
          {[0, 1].map((index) => <div key={index} className={styles.stack}><Bone w={90} h={12} /><Bone h={56} r={14} /></div>)}
          <Bone w={130} h={12} />
          <Bone h={58} r={29} />
          <Bone w="55%" h={12} className={styles.center} />
        </div>
      </div>
    </main>
  );
}
=======
function Logo() {
  return (
    <div className={styles.status} role="status">
      <span className={styles.srOnly}>Loading Teech</span>
      <div className={styles.loader} aria-hidden="true">
        <div className={styles.logo}>
          <Image className={styles.logoImage} src="/logo/teech_logo.svg" alt="" width={1118} height={348} priority />
        </div>
        <svg className={styles.trail} viewBox="0 0 156 20" fill="none">
          <path d="M3 10 Q 15.5 2 28 10 T 53 10 T 78 10 T 103 10 T 128 10 T 153 10" />
        </svg>
        <p className={styles.messages}>
          {loadingMessages.map((message, index) => (
            <span key={message} style={{ "--i": index } as CSSProperties}>{message}</span>
          ))}
        </p>
      </div>
    </div>
  );
}

function activeFor(role: Role, page: string | undefined) {
  if (page === "home" || !page) return "home";
  if (page === "faculty") return "faculty";
  if (page === "appointment-requests" || page === "requests" || page === "request-submitted") return "requests";
  if (role === "student" && bookingPages.includes(page)) return "faculty";
  if (page === "calendar" || page === "availability") return "calendar";
  if (page === "notifications") return "notifications";
  if (page === "points") return "points";
  if (page === "profile") return "profile";
  return "";
}
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
