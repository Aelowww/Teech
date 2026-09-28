export type AppointmentDraft = {
  studentName: string;
  studentId: string;
  courseYear: string;
  facultyId: string;
  facultyName: string;
  preferredDate: string;
  preferredTime: string;
  meetingLocation: string;
  reason: string;
  details: string;
};

const draftKey = "teech.appointment-draft";

export const emptyAppointmentDraft: AppointmentDraft = {
  studentName: "",
  studentId: "",
  courseYear: "",
  facultyId: "",
  facultyName: "",
  preferredDate: "",
  preferredTime: "",
  meetingLocation: "",
  reason: "",
  details: "",
};

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeValue(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the form usable when browser storage is unavailable.
  }
}

export function getAppointmentDraft() {
  return { ...emptyAppointmentDraft, ...readValue<Partial<AppointmentDraft>>(draftKey, {}) };
}

export function saveAppointmentDraft(draft: AppointmentDraft) {
  writeValue(draftKey, draft);
}

export function isAppointmentDraftComplete(draft: AppointmentDraft) {
  return [
    draft.studentName,
    draft.studentId,
    draft.courseYear,
    draft.facultyId,
    draft.facultyName,
    draft.preferredDate,
    draft.preferredTime,
    draft.reason,
  ].every((value) => value.trim());
}
