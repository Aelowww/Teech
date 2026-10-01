import { Award, BookOpen, CalendarCheck, Camera, Crown, DoorOpen, Flame, GraduationCap, Moon, Rocket, ShieldCheck, Sparkles, Zap, type LucideIcon } from "lucide-react";

export const badgeIcons: Record<string, LucideIcon> = {
  "streak-7": Flame,
  "streak-30": CalendarCheck,
  "streak-100": Rocket,
  photo: Camera,
  security: ShieldCheck,
  "first-consultation": Sparkles,
  regular: GraduationCap,
  "open-door": DoorOpen,
  "quick-responder": Zap,
  mentor: Award,
  "shop-bookworm": BookOpen,
  "shop-night-owl": Moon,
  "shop-legend": Crown,
};

export function badgeIcon(id: string) {
  return badgeIcons[id] || Award;
}

export const badgeColors: Record<string, [string, string]> = {
  photo: ["#ffe3ee", "#d8508a"],
  "streak-7": ["#ffe9d6", "#e0782e"],
  "streak-30": ["#dff5ee", "#23946b"],
  "streak-100": ["#e9e4ff", "#6a55d8"],
  security: ["#e0f3e6", "#2f8f55"],
  "first-consultation": ["#fff4cf", "#c9921a"],
  regular: ["#e1efff", "#3b7bd4"],
  "open-door": ["#e6f6f3", "#26917f"],
  "quick-responder": ["#fff4cf", "#c9921a"],
  mentor: ["#f1e6ff", "#8a4fd0"],
  "shop-bookworm": ["#e1efff", "#3b7bd4"],
  "shop-night-owl": ["#e7e8fb", "#4d52b8"],
  "shop-legend": ["#fff1cc", "#c28a0e"],
};
