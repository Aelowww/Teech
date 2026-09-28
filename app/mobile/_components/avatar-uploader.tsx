"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle } from "lucide-react";
import { ProfilePhoto } from "@/app/mobile/_components/ui";
import { ConfirmationModal } from "@/app/mobile/_components/confirmation-modal";
import { avatarBucket, avatarUrl, toSquareJpeg } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import styles from "./avatar-uploader.module.css";

const maxUploadBytes = 10 * 1024 * 1024;

export function AvatarUploader({ initialPath }: { initialPath: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(initialPath);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  async function saveAvatarPath(nextPath: string | null) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Your session has expired. Please sign in again.";
    const { error: updateError } = await supabase.from("profiles").update({ avatar_path: nextPath }).eq("auth_user_id", user.id);
    if (updateError) return updateError.message;
    if (path) await supabase.storage.from(avatarBucket).remove([path]);
    setPath(nextPath);
    router.refresh();
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    if (file.size > maxUploadBytes) { setError("Choose an image smaller than 10 MB."); return; }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Your session has expired. Please sign in again."); return; }
      const image = await toSquareJpeg(file);
      const nextPath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from(avatarBucket).upload(nextPath, image, { contentType: "image/jpeg" });
      if (uploadError) { setError(uploadError.message); return; }
      const saveError = await saveAvatarPath(nextPath);
      if (saveError) {
        await supabase.storage.from(avatarBucket).remove([nextPath]);
        setError(saveError);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Your photo could not be uploaded.");
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    setError("");
    return saveAvatarPath(null);
  }

  return (
    <div className={styles.uploader}>
      <div className={styles.photo}>
        <ProfilePhoto src={avatarUrl(path)} />
        <button className={styles.cameraButton} type="button" onClick={() => inputRef.current?.click()} disabled={saving} aria-label={path ? "Change profile photo" : "Upload profile photo"}>
          {saving ? <LoaderCircle className={styles.spinner} size={15} /> : <Camera size={15} />}
        </button>
        <input ref={inputRef} className={styles.input} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} />
      </div>
      {path && !saving && <button className={styles.removeButton} type="button" onClick={() => setConfirmingRemoval(true)}>Remove photo</button>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ConfirmationModal open={confirmingRemoval} title="Remove profile photo?" description="Your profile will show the default icon instead." confirmLabel="Remove Photo" tone="danger" onCancel={() => setConfirmingRemoval(false)} onConfirm={removePhoto} />
    </div>
  );
}
