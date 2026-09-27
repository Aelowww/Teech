export function studentAuthEmail(studentId: string) {
  const encodedId = Array.from(studentId.trim().toLowerCase())
    .map((character) => character.codePointAt(0)?.toString(16).padStart(4, "0"))
    .join("-");

  return `student-${encodedId}@students.teech.local`;
}
