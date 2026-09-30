import { Bell, CalendarDays, CircleUserRound, ClipboardList, House, Sparkles, UsersRound, type LucideIcon } from "lucide-react";

export type NavIconName = "house" | "users" | "clipboard" | "profile" | "calendar" | "bell" | "sparkles";

const outlineIcons: Record<NavIconName, LucideIcon> = {
  house: House,
  users: UsersRound,
  clipboard: ClipboardList,
  profile: CircleUserRound,
  calendar: CalendarDays,
  bell: Bell,
  sparkles: Sparkles,
};

type Part = ["path" | "circle" | "rect", Record<string, string | number>, "solid" | "line" | "cut" | "cutFill" | "cutShape" | "ring"];

const filledIcons: Record<NavIconName, Part[]> = {
  house: [
    ["path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }, "solid"],
    ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }, "cut"],
  ],
  users: [
    ["path", { d: "M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" }, "line"],
    ["path", { d: "M18 21a8 8 0 0 0-16 0" }, "solid"],
    ["circle", { cx: 10, cy: 8, r: 5 }, "ring"],
  ],
  clipboard: [
    ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }, "solid"],
    ["rect", { width: 8, height: 4, x: 8, y: 2, rx: 1, ry: 1 }, "ring"],
    ["path", { d: "M12 11h4" }, "cut"],
    ["path", { d: "M12 16h4" }, "cut"],
    ["path", { d: "M8 11h.01" }, "cut"],
    ["path", { d: "M8 16h.01" }, "cut"],
  ],
  profile: [
    ["circle", { cx: 12, cy: 12, r: 10 }, "solid"],
    ["circle", { cx: 12, cy: 10, r: 3.5 }, "cutShape"],
    ["path", { d: "M17.5 20a5.5 5.5 0 0 0-11 0" }, "cutShape"],
  ],
  calendar: [
    ["rect", { width: 18, height: 18, x: 3, y: 4, rx: 2 }, "solid"],
    ["path", { d: "M8 2v4" }, "line"],
    ["path", { d: "M16 2v4" }, "line"],
    ["path", { d: "M3 10h18" }, "cut"],
    ["path", { d: "M8 14h.01" }, "cut"],
    ["path", { d: "M12 14h.01" }, "cut"],
    ["path", { d: "M16 14h.01" }, "cut"],
    ["path", { d: "M8 18h.01" }, "cut"],
    ["path", { d: "M12 18h.01" }, "cut"],
    ["path", { d: "M16 18h.01" }, "cut"],
  ],
  bell: [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0" }, "line"],
    ["path", { d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" }, "solid"],
  ],
  sparkles: [
    ["path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }, "solid"],
    ["path", { d: "M20 3v4" }, "line"],
    ["path", { d: "M22 5h-4" }, "line"],
    ["path", { d: "M4 17v2" }, "line"],
    ["path", { d: "M5 18H3" }, "line"],
  ],
};

const cutColor = "var(--nav-icon-cut, #fff)";

const paint = {
  solid: { fill: "currentColor", stroke: "currentColor" },
  line: { fill: "none", stroke: "currentColor" },
  cut: { fill: "none", stroke: cutColor },
  cutFill: { fill: cutColor, stroke: cutColor },
  cutShape: { fill: cutColor, stroke: "none" },
  ring: { fill: "currentColor", stroke: cutColor },
};

export function NavIcon({ name, filled = false, size = 20 }: { name: NavIconName; filled?: boolean; size?: number }) {
  if (!filled) {
    const Outline = outlineIcons[name];
    return <Outline size={size} strokeWidth={1.8} aria-hidden="true" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {filledIcons[name].map(([Tag, attrs, kind], index) => <Tag key={index} {...attrs} {...paint[kind]} />)}
    </svg>
  );
}
