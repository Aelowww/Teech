type AvailabilityWindow = { start_time: string; end_time: string };

function minutesOf(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatSlot(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${period}`;
}

function slotMinutes(label: string) {
  const [clock, period] = label.split(" ");
  const [hourText, minuteText] = clock.split(":");
  let hours = Number(hourText);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + Number(minuteText);
}

export function slotsFor(windows: AvailabilityWindow[]) {
  const starts = new Set<number>();
  for (const window of windows) {
    for (let minute = minutesOf(window.start_time); minute < minutesOf(window.end_time); minute += 60) {
      starts.add(minute);
    }
  }
  return [...starts].sort((first, second) => first - second).map(formatSlot);
}

export function isPastSlotToday(date: string, label: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return date === today && slotMinutes(label) <= now.getHours() * 60 + now.getMinutes();
}
