"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, FolderOpen, Images, LoaderCircle } from "lucide-react";
import { ProfilePhoto } from "@/app/desktop/_components/ui";
import { ConfirmationModal } from "@/app/desktop/_components/confirmation-modal";
import { avatarBucket, signedAvatarUrl, toSquareJpeg } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import styles from "./avatar-uploader.module.css";

const maxUploadBytes = 10 * 1024 * 1024;

const sources = [
  { id: "camera", label: "Take photo", icon: Camera, accept: "image/*", capture: "user" },
  { id: "photos", label: "Upload from photos", icon: Images, accept: "image/*" },
  { id: "files", label: "Import from files", icon: FolderOpen, accept: ".jpg,.jpeg,.png,.webp" },
] as const;

type Source = (typeof sources)[number]["id"];

export function AvatarUploader({ initialPath, initialUrl = null, compact = false }: { initialPath: string | null; initialUrl?: string | null; compact?: boolean }) {
  const router = useRouter();
  const inputRefs = useRef<Partial<Record<Source, HTMLInputElement | null>>>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [path, setPath] = useState(initialPath);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialUrl);

  useEffect(() => {
    if (initialUrl && path === initialPath) return;
    let active = true;
    void signedAvatarUrl(createClient(), path).then((url) => { if (active) setPhotoUrl(url); });
    return () => { active = false; };
  }, [path, initialPath, initialUrl]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [notice, setNotice] = useState<"updated" | "removed" | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function choose(source: Source) {
    setMenuOpen(false);
    inputRefs.current[source]?.click();
  }

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
      } else {
        setNotice("updated");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Your photo could not be uploaded.");
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    setError("");
    const removeError = await saveAvatarPath(null);
    if (removeError) return removeError;
    setNotice("removed");
  }

  return (
    <div className={`${styles.uploader} ${compact ? styles.compact : ""}`}>
      <div className={styles.photo} ref={wrapRef}>
        <ProfilePhoto src={photoUrl} />
        <button
          className={styles.cameraButton}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={saving}
          aria-label={path ? "Change profile photo" : "Upload profile photo"}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          {saving ? <LoaderCircle className={styles.spinner} size={15} /> : <Camera size={15} />}
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu" aria-label="Change profile photo">
            {sources.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="menuitem" onClick={() => choose(id)}>
                <Icon size={16} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        )}
        {sources.map((source) => (
          <input
            key={source.id}
            ref={(element) => { inputRefs.current[source.id] = element; }}
            className={styles.input}
            type="file"
            accept={source.accept}
            capture={"capture" in source ? source.capture : undefined}
            onChange={uploadPhoto}
            tabIndex={-1}
            aria-hidden="true"
          />
        ))}
      </div>
      {path && !saving && !compact && <button className={styles.removeButton} type="button" onClick={() => setConfirmingRemoval(true)}>Remove photo</button>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ConfirmationModal open={confirmingRemoval} title="Remove profile photo?" description="Your profile will show the default icon instead." confirmLabel="Remove Photo" tone="danger" onCancel={() => setConfirmingRemoval(false)} onConfirm={removePhoto} />
      <ConfirmationModal open={notice !== null} title={notice === "removed" ? "Profile photo removed" : "Profile photo updated"} description={notice === "removed" ? "Your profile now shows the default icon." : "Your new photo is now on your profile."} confirmLabel="Done" icon={CheckCircle2} hideCancel onCancel={() => setNotice(null)} onConfirm={() => setNotice(null)} />
    </div>
  );
}
