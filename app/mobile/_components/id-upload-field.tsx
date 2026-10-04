"use client";

import { useEffect, useState } from "react";
import { FileText, ImageUp, X } from "lucide-react";
import { facultyIdAccept } from "@/lib/faculty-id";
import uiStyles from "./ui.module.css";
import styles from "./id-upload-field.module.css";

export function IdUploadField({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const frame = requestAnimationFrame(() => setPreview(url));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
      setPreview("");
    };
  }, [file]);

  return (
    <div className={uiStyles.field}>
      <span>{label}</span>
      {file ? (
        <div className={styles.selected}>
          {preview ? <span className={styles.thumb} style={{ backgroundImage: `url(${preview})` }} aria-hidden="true" /> : <span className={styles.icon}><FileText size={18} /></span>}
          <span className={styles.name}><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></span>
          <button className={styles.remove} type="button" onClick={() => onChange(null)} aria-label="Remove file"><X size={15} /></button>
        </div>
      ) : (
        <label className={styles.drop}>
          <span className={styles.icon}><ImageUp size={18} /></span>
          <span className={styles.name}><strong>Upload a clear photo of your ID</strong><small>JPG, PNG, WEBP, or PDF up to 5 MB</small></span>
          <input type="file" accept={facultyIdAccept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} aria-label={label} required />
        </label>
      )}
    </div>
  );
}
