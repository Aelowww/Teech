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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { path: null, error: "Your session has expired. Please sign in again." };
  const extension = extensions[file.type];
  const path = `submissions/${user.id}/id.${extension}`;
  const { error } = await supabase.storage.from(facultyIdBucket).upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { path: null, error: "We couldn't upload your ID photo. Please try again." };
  const stale = Object.values(extensions).filter((other) => other !== extension).map((other) => `submissions/${user.id}/id.${other}`);
  await supabase.storage.from(facultyIdBucket).remove(stale);
  return { path, error: "" };
}
