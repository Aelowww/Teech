import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Info,
  Inbox,
  LockKeyhole,
  Mail,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { AppShell } from "./app-shell";
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
  imageUrl?: string | null;
};

export function DesktopLayout({
  children,
  className,
  backTo,
  role,
  activeNav,
}: {
  children: React.ReactNode;
  className?: string;
  backTo?: string;
  role?: "student" | "faculty";
  activeNav?: string;
}) {
  // Signed-in pages: header + sidebar website frame.
  if (role) {
    return (
      <AppShell role={role} active={activeNav || ""} backTo={backTo} className={[styles.shellContent, className].filter(Boolean).join(" ")}>
        {children}
      </AppShell>
    );
  }

  // Guest pages (splash, password reset, account created): centered card on the lavender canvas.
  return (
    <main className={styles.guest}>
      <div className={styles.circle} aria-hidden="true" />
      <div className={styles.circleBottom} aria-hidden="true" />
      {backTo && (
        <Link className={styles.back} href={backTo} aria-label="Go back">
          <ArrowLeft size={20} />
        </Link>
      )}
      <div className={[styles.guestCard, className].filter(Boolean).join(" ")}>{children}</div>
      <footer className={styles.footer}>Teech <span>•</span> Student &amp; Faculty Portal</footer>
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
  name,
  value,
  onChange,
  required = false,
  readOnly = false,
  maxLength,
  inputMode,
  pattern,
}: {
  label: string;
  placeholder: string;
  type?: string;
  name?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
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
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label}
          required={required}
          readOnly={readOnly}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
        />
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

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <section className={styles.emptyState}>
      {icon ? <span className={styles.emptyIcon} aria-hidden="true">{icon}</span> : <Inbox size={28} aria-hidden="true" />}
      <strong>{title}</strong>
      <p>{description}</p>
      {action && <Link className={styles.emptyAction} href={action.href}>{action.label}<ChevronRight size={15} /></Link>}
    </section>
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
      {items.map((item) => {
        const card = <>
          <span className={styles.itemAvatar}>{item.imageUrl ? <Image className={styles.avatarImage} src={item.imageUrl} alt="" fill sizes="35px" unoptimized /> : <UserRound size={18} />}</span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
            {item.status && <em className={item.status === "Available" || item.status === "Confirmed" ? styles.statusGood : styles.statusBad}>{item.status}</em>}
          </div>
          {item.href && <ChevronRight size={16} />}
        </>;

        return item.href
          ? <Link href={item.href} className={styles.listCard} key={`${item.title}-${item.description}`}>{card}</Link>
          : <article className={styles.listCard} key={`${item.title}-${item.description}`}>{card}</article>;
      })}
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

export function MonthCalendar({
  month = new Date(),
  selectedDate,
  selectedDates = [],
  markedDates = [],
  availableDates,
  legend = "Select a date",
  disablePastDates = true,
  onSelectDate,
  onMonthChange,
}: {
  month?: Date;
  selectedDate?: string;
  selectedDates?: string[];
  markedDates?: string[];
  availableDates?: string[];
  legend?: string;
  disablePastDates?: boolean;
  onSelectDate?: (date: string) => void;
  onMonthChange?: (month: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function dateValue(day: number) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function changeMonth(offset: number) {
    onMonthChange?.(new Date(year, monthIndex + offset, 1));
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        {onMonthChange
          ? <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={14} /></button>
          : <span className={styles.calendarControl}><ChevronLeft size={14} /></span>}
        <strong>{monthLabel}</strong>
        {onMonthChange
          ? <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={14} /></button>
          : <span className={styles.calendarControl}><ChevronRight size={14} /></span>}
      </div>
      <div className={styles.legend}><i /> {legend}</div>
      <div className={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span className={styles.weekday} key={`${day}${index}`}>{day}</span>)}
        {days.map((day, index) => {
          const date = day > 0 && day <= daysInMonth ? dateValue(day) : "";
          const selected = selectedDate === date || selectedDates.includes(date);
          const marked = markedDates.includes(date);
          const isAvailable = availableDates?.includes(date);
          const isPastDate = disablePastDates && date < today;
          const className = `${styles.day} ${selected ? styles.daySelected : ""} ${marked && !selected ? styles.dayMarked : ""} ${isAvailable && !selected ? styles.dayAvailable : ""}`;
          return day > 0 && day <= daysInMonth
            ? onSelectDate && !isPastDate && (!availableDates || availableDates.includes(date))
              ? <button type="button" key={index} className={className} onClick={() => onSelectDate(date)}>{day}</button>
              : <span key={index} className={`${className} ${(availableDates || isPastDate) ? styles.dayDisabled : ""}`}>{day}</span>
            : <span key={index} className={styles.day} />;
        })}
      </div>
    </div>
  );
}

export function AvailabilitySlots({
  times,
  selectedTime,
  onSelectTime,
  unavailableTimes = [],
  disabled = false,
}: {
  times: string[];
  selectedTime?: string;
  onSelectTime?: (time: string) => void;
  unavailableTimes?: string[];
  disabled?: boolean;
}) {
  const morningSlots = times.filter((time) => !time.includes("PM"));
  const afternoonSlots = times.filter((time) => time.includes("PM"));

  function renderSlots(slots: string[]) {
    return slots.map((time) => (
      <label className={`${styles.timeToggle} ${unavailableTimes.includes(time) ? styles.timeUnavailable : ""}`} key={time}>
        {time}
        {onSelectTime
          ? <input type="radio" name="appointment-time" checked={selectedTime === time} onChange={() => onSelectTime(time)} disabled={disabled || unavailableTimes.includes(time)} />
          : <input type="checkbox" disabled={disabled || unavailableTimes.includes(time)} />}
      </label>
    ));
  }

  return (
    <div className={styles.availabilityForm}>
      {morningSlots.length > 0 && <section className={styles.slotGroup}><p className={styles.slotLabel}>Morning</p>{renderSlots(morningSlots)}</section>}
      {afternoonSlots.length > 0 && <section className={styles.slotGroup}><p className={styles.slotLabel}>Afternoon</p>{renderSlots(afternoonSlots)}</section>}
    </div>
  );
}

export function ProfilePhoto({ inline = false, src }: { inline?: boolean; src?: string | null }) {
  return (
    <div className={`${styles.avatar} ${inline ? styles.avatarInline : ""}`}>
      {src ? <Image className={styles.avatarImage} src={src} alt="Profile photo" fill sizes="120px" unoptimized /> : <UserRound size={31} />}
    </div>
  );
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


export function SpotlightCard({
  eyebrow,
  title,
  details = [],
  href,
  actionLabel,
  muted = false,
}: {
  eyebrow: string;
  title: string;
  details?: { icon: React.ReactNode; text: string }[];
  href: string;
  actionLabel: string;
  muted?: boolean;
}) {
  return (
    <Link className={`${styles.spotlight} ${muted ? styles.spotlightMuted : ""}`} href={href}>
      <small>{eyebrow}</small>
      <strong>{title}</strong>
      {details.length > 0 && <ul>{details.map(({ icon, text }) => <li key={text}>{icon}<span>{text}</span></li>)}</ul>}
      <span className={styles.spotlightAction}>{actionLabel}<ChevronRight size={14} /></span>
    </Link>
  );
}

export const tagline = "Teach within your reach";
