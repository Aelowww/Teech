import { CalendarDays, CircleUserRound, ClipboardList, House, UsersRound, type LucideIcon } from "lucide-react";

export type NavIconName = "house" | "users" | "clipboard" | "profile" | "calendar";

const outlineIcons: Record<NavIconName, LucideIcon> = {
  house: House,
  users: UsersRound,
  clipboard: ClipboardList,
  profile: CircleUserRound,
  calendar: CalendarDays,
};

// Filled versions of the same Lucide shapes. Lucide only ships outlines, and simply
// filling those hides their inner details, so each part is drawn as one of:
//   solid  – filled shape in the icon colour
//   line   – outline in the icon colour
//   cut    – detail drawn in the bar's background colour, so it reads as cut out
//   cutFill – filled detail in the background colour
//   cutShape – like cutFill but without an edge, for details that must stay inside the shape
//   ring   – filled shape with a background-coloured edge, to separate touching parts
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
