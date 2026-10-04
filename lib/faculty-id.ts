import { createClient } from "@/lib/supabase/client";

export const facultyIdBucket = "faculty-ids";
export const facultyIdAccept = "image/jpeg,image/png,image/webp,application/pdf";
const maxBytes = 5 * 1024 * 1024;

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function facultyIdFileError(file: File | null, label = "Faculty ID") {
  if (!file) return `Upload a photo of your ${label}.`;
  if (!extensions[file.type]) return `Upload your ${label} as a JPG, PNG, WEBP, or PDF.`;
  if (file.size > maxBytes) return `Your ${label} file must be 5 MB or smaller.`;
  return "";
}

export async function uploadFacultyId(file: File) {
  const path = `submissions/${crypto.randomUUID()}/id.${extensions[file.type]}`;
  const { error } = await createClient().storage.from(facultyIdBucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { path: null, error: "We couldn't upload your ID photo. Please try again." };
  return { path, error: "" };
}
