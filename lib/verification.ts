"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { facultyIdFileError, uploadFacultyId } from "@/lib/faculty-id";

export type Role = "student" | "faculty";
export type VerificationStatus = "pending" | "verified" | "rejected";

export type Verification = {
  role: Role;
  status: VerificationStatus;
  identifier: string | null;
  rejectedIdentifier: string | null;
  note: string | null;
};

type State = { loading: true; verification: null; error: "" } | { loading: false; verification: Verification | null; error: string };

export function identifierLabel(role: Role) {
  return role === "student" ? "Student ID" : "Faculty ID";
}

export function useVerification() {
  const [state, setState] = useState<State>({ loading: true, verification: null, error: "" });

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState({ loading: false, verification: null, error: "Please sign in again." });
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("role, verification_status, verification_note, rejected_identifier, student_number, faculty_number")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (error || !data || (data.role !== "student" && data.role !== "faculty")) {
      setState({ loading: false, verification: null, error: "We couldn't check your verification status. Please try again." });
      return;
    }
    setState({
      loading: false,
      error: "",
      verification: {
        role: data.role,
        status: data.verification_status as VerificationStatus,
        identifier: data.role === "student" ? data.student_number : data.faculty_number,
        rejectedIdentifier: data.rejected_identifier,
        note: data.verification_note,
      },
    });
  }, []);

  useEffect(() => {
    let active = true;
    const run = () => { if (active) void load(); };
    run();
    const onVisible = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { ...state, reload: load };
}

const resubmitMessages: Record<string, string> = {
  invalid: "Check the ID format and try again.",
  taken: "That ID is already linked to another account. Contact support if it's yours.",
  too_many: "You've resubmitted too many times today. Try again tomorrow.",
  not_rejected: "Your account isn't waiting on a correction right now.",
  not_allowed: "This account can't be verified.",
  document_required: "Upload a photo of your Faculty ID.",
};

export async function resubmitVerification(role: Role, identifier: string, idFile: File | null) {
  let documentPath: string | null = null;
  if (role === "faculty") {
    const fileError = facultyIdFileError(idFile);
    if (fileError || !idFile) return fileError;
    const upload = await uploadFacultyId(idFile);
    if (!upload.path) return upload.error;
    documentPath = upload.path;
  }
  const { data, error } = await createClient().rpc("resubmit_my_verification", { new_identifier: identifier.trim(), document_path: documentPath });
  if (error) return error.message;
  if (data === "ok") return null;
  return resubmitMessages[data as string] || "Something went wrong. Please try again.";
}
