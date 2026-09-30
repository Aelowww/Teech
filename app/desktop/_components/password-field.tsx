"use client";

import { useState, type ChangeEventHandler } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import styles from "./ui.module.css";

type PasswordFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputWrap}>
        <LockKeyhole size={15} />
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={label}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          className={styles.passwordToggle}
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
