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
