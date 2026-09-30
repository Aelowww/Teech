import type { SupabaseClient } from "@supabase/supabase-js";

export const avatarBucket = "avatars";

export async function signedAvatarUrl(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from(avatarBucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl || null;
}

export async function studentAvatarUrls(supabase: SupabaseClient, requestIds: string[]) {
  const urls = new Map<string, string>();
  if (!requestIds.length) return urls;
  const { data: rows } = await supabase.rpc("request_student_avatars", { request_ids: requestIds });
  const paths = ((rows || []) as { request_id: string; avatar_path: string }[]);
  if (!paths.length) return urls;
  const { data: signed } = await supabase.storage.from(avatarBucket).createSignedUrls([...new Set(paths.map((row) => row.avatar_path))], 60 * 60);
  const byPath = new Map((signed || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
  for (const row of paths) {
    const url = byPath.get(row.avatar_path);
    if (url) urls.set(row.request_id, url);
  }
  return urls;
}

export async function toSquareJpeg(file: File, maxSize = 512) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(maxSize, side);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not process this image.");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not process this image.")), "image/jpeg", 0.85);
  });
}
