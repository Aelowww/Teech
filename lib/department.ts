export const DEPARTMENT = "IT";

export function courseYearLabel(year: string) {
  return `${DEPARTMENT} - Year ${year}`;
}

export function yearFromCourseYear(courseYear: string | null) {
  return courseYear?.match(/Year ([1-4])/)?.[1] ?? "";
}
