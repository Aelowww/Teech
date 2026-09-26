import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  GraduationCap,
  House,
  Info,
  LockKeyhole,
  Mail,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import styles from "./ui.module.css";

export type Action = {
  label: string;
  href: string;
  tone?: "danger";
};

export type Detail = {
  label: string;
  value: string;
};

export type CardItem = {
  title: string;
  description: string;
  status?: string;
  href?: string;
};

export function MobileLayout({
  children,
  className,
  backTo,
  role,
  activeNav,
}: {
  children: React.ReactNode;
  className?: string;
  backTo?: string;
  role?: "student" | "teacher";
  activeNav?: string;
}) {
  return (
    <main className={styles.stage}>
      <article className={`${styles.phone} ${className || ""}`}>
        {backTo && (
          <Link className={styles.back} href={backTo} aria-label="Go back">
            <ArrowLeft size={19} />
          </Link>
        )}
        <div className={styles.content}>{children}</div>
        {role && <BottomNavigation role={role} active={activeNav || ""} />}
        <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
      </article>
    </main>
  );
}

export function BrandLogo({ large = false }: { large?: boolean }) {
  return (
    <div className={`${styles.logo} ${large ? styles.logoLarge : ""}`}>
      <Image
        className={styles.logoImage}
        src="/logo/teech_logo.svg"
        alt="Teech"
        width={1118}
        height={348}
        priority
      />
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  display = false,
}: {
  title: string;
  subtitle?: string;
  display?: boolean;
}) {
  return (
    <>
      <h1 className={`${styles.title} ${display ? styles.displayTitle : ""}`}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </>
  );
}

export function ActionLink({
  action,
  primary = false,
}: {
  action: Action;
  primary?: boolean;
}) {
  return (
    <Link
      className={`${styles.action} ${primary ? styles.actionPrimary : ""} ${action.tone === "danger" ? styles.actionDanger : ""}`}
      href={action.href}
    >
      {action.label}
      {primary && <ChevronRight size={16} />}
    </Link>
  );
}

export function ActionButtons({
  actions,
  primaryLabel,
  className,
}: {
  actions: Action[];
  primaryLabel?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.actions} ${actions.length > 1 ? styles.actionsMultiple : ""} ${className || ""}`}>
      {actions.map((action) => (
        <ActionLink key={action.label} action={action} primary={action.label === primaryLabel} />
      ))}
    </div>
  );
}

export function FormField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  const labelLower = label.toLowerCase();
  const Icon = labelLower.includes("mail") || labelLower.includes("email")
    ? Mail
    : labelLower.includes("password")
      ? LockKeyhole
      : labelLower.includes("search")
        ? Search
        : labelLower.includes("faculty")
          ? GraduationCap
          : UserRound;
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputWrap}>
        <Icon size={15} />
        <input type={type} placeholder={placeholder} aria-label={label} />
      </div>
    </label>
  );
}

export function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div className={`${styles.message} ${error ? styles.messageError : ""}`}>
      <Info size={15} />
      <span>{children}</span>
    </div>
  );
}

export function StatusIndicator({
  status,
}: {
  status: "success" | "pending" | "error" | "declined";
}) {
  const failed = status === "error" || status === "declined";
  const Icon = failed ? X : status === "pending" ? Clock3 : Check;
  return (
    <div className={`${styles.statusMark} ${failed ? styles.statusError : ""} ${status === "pending" ? styles.statusPending : ""}`}>
      <Icon size={36} strokeWidth={2.8} />
    </div>
  );
}

export function DetailList({ details }: { details: Detail[] }) {
  return (
    <div className={styles.detailsCard}>
      {details.map((detail) => (
        <div className={styles.detailRow} key={`${detail.label}-${detail.value}`}>
          <span className={styles.detailIcon}><Check size={15} /></span>
          <div><small>{detail.label}</small><strong>{detail.value}</strong></div>
        </div>
      ))}
    </div>
  );
}

export function CardList({ items }: { items: CardItem[] }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <Link href={item.href || "#"} className={styles.listCard} key={`${item.title}-${item.description}`}>
          <span className={styles.itemAvatar}><UserRound size={18} /></span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
            {item.status && <em className={item.status === "Available" || item.status === "Confirmed" ? styles.statusGood : styles.statusBad}>{item.status}</em>}
          </div>
          <ChevronRight size={16} />
        </Link>
      ))}
    </div>
  );
}

export function FilterTabs({
  filters,
  selected,
  hrefs,
}: {
  filters: string[];
  selected: number;
  hrefs?: string[];
}) {
  return (
    <div className={styles.filters}>
      {filters.map((filter, index) => (
        <Link key={filter} href={hrefs?.[index] || "#"} className={index === selected ? styles.filterSelected : ""}>
          {filter}
        </Link>
      ))}
    </div>
  );
}

export function MonthCalendar() {
  const days = Array.from({ length: 35 }, (_, index) => index - 5);
  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button aria-label="Previous month"><ArrowLeft size={14} /></button>
        <strong>August 2026</strong>
        <button aria-label="Next month"><ChevronRight size={14} /></button>
      </div>
      <div className={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span className={styles.weekday} key={`${day}${index}`}>{day}</span>)}
        {days.map((day, index) => (
          <span key={index} className={`${styles.day} ${day === 21 ? styles.daySelected : ""}`}>
            {day > 0 && day <= 31 ? day : ""}
          </span>
        ))}
      </div>
      <div className={styles.legend}><i /> Available <i /> Limited slots <i /> Fully booked</div>
    </div>
  );
}

export function AvailabilitySlots({ times }: { times: string[] }) {
  return (
    <div className={styles.availabilityForm}>
      <FormField label="Date" placeholder="August 21, 2026" />
      <p className={styles.fieldHeading}>Time slots</p>
      {times.map((time, index) => (
        <label className={styles.timeToggle} key={time}>
          {time}
          <input type="checkbox" defaultChecked={index < 2 || index === 4} />
        </label>
      ))}
    </div>
  );
}

export function ProfilePhoto({ inline = false }: { inline?: boolean }) {
  return <div className={`${styles.avatar} ${inline ? styles.avatarInline : ""}`}><UserRound size={31} /></div>;
}

export function ConfirmationDialog({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={styles.dialogCard}>
      <div className={`${styles.dialogIcon} ${danger ? styles.dialogDanger : ""}`}>
        {danger ? <X size={19} /> : <Check size={19} />}
      </div>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <div className={`${styles.inputWrap} ${styles.searchWrap}`}>
      <Search size={15} />
      <input placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function BottomNavigation({
  role,
  active,
}: {
  role: "student" | "teacher";
  active: string;
}) {
  const items = role === "teacher"
    ? [
        { label: "Home", href: "/teacher/home", Icon: House },
        { label: "Calendar", href: "/teacher/calendar", Icon: CalendarDays },
        { label: "Notifications", href: "/teacher/notifications", Icon: Bell },
        { label: "Profile", href: "/teacher/profile", Icon: CircleUserRound },
      ]
    : [
        { label: "Home", href: "/student/home", Icon: House },
        { label: "Faculty", href: "/student/faculty", Icon: UsersRound },
        { label: "Notifications", href: "/student/appointment-requests", Icon: Bell },
        { label: "Profile", href: "/student/profile", Icon: CircleUserRound },
      ];
  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {items.map(({ label, href, Icon }) => (
        <Link key={label} href={href} className={`${styles.navItem} ${active === label.toLowerCase() ? styles.navActive : ""}`}>
          <Icon size={19} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
