import { createClient } from "@/lib/supabase/client";
import { accountRole } from "@/lib/account-role";
import { facultyIdFileError, uploadFacultyId } from "@/lib/faculty-id";

type Role = "student" | "faculty";

export type SignInResult = { ok: true } | { ok: false; error: string; unconfirmedEmail?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

function confirmRedirect(role: Role) {
  const next = role === "faculty" ? "/faculty/sign-in?confirmed=1" : "/student/home";
  return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signInAs(role: Role, identifier: string, password: string): Promise<SignInResult> {
  const supabase = createClient();
  const label = role === "student" ? "Student ID" : "Faculty ID";
  const { data: resolved, error: resolveError } = await supabase.rpc("resolve_sign_in", { requested_role: role, identifier: identifier.trim(), password });
  if (resolveError) return { ok: false, error: "We couldn't sign you in right now. Please try again." };
  const match = (resolved as { status: string; email: string | null }[] | null)?.[0];
  if (match?.status === "locked") return { ok: false, error: "Too many incorrect attempts. Try again later, or reset your password." };
  if (match?.status === "pending_verification") return { ok: false, error: "Your account is waiting for admin verification. We'll email you as soon as your Faculty ID is approved." };
  if (match?.status !== "ok" || !match.email) return { ok: false, error: `Incorrect ${label} or password.` };

  const email = match.email;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: "Confirm your email first. Check your inbox for the link we sent.", unconfirmedEmail: email };
    }
    if (error?.code === "invalid_credentials") return { ok: false, error: `Incorrect ${label} or password.` };
    return { ok: false, error: error?.message || "Unable to sign in." };
  }

  const accountType = await accountRole(supabase, data.user.id);
  if (!accountType) {
    await supabase.auth.signOut();
    return { ok: false, error: "We couldn't load your profile. Please try again in a moment." };
  }

  if (accountType !== role) {
    await supabase.auth.signOut();
    return { ok: false, error: role === "student" ? "This account is not registered as a student." : "This account is not registered as faculty." };
  }

  return { ok: true };
}

export async function resendConfirmation(role: Role, email: string) {
  const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmRedirect(role) } });
  if (!error) return null;
  return error.code === "over_email_send_rate_limit" ? "Please wait a minute before requesting another email." : error.message;
}

type StudentSignUp = { fullName: string; email: string; studentNumber: string; courseYear: string; password: string };
type FacultySignUp = { fullName: string; email: string; facultyNumber: string; department: string; password: string; idFile: File | null };

export async function signUpStudent(form: StudentSignUp) {
  return signUp("student", form.email, form.password, {
    role: "student",
    full_name: form.fullName.trim(),
    student_number: form.studentNumber.trim(),
    course_year: form.courseYear.trim(),
  });
}

export async function signUpFaculty(form: FacultySignUp) {
  const fileError = facultyIdFileError(form.idFile);
  if (fileError || !form.idFile) return fileError;
  const upload = await uploadFacultyId(form.idFile);
  if (!upload.path) return upload.error;
  return signUp("faculty", form.email, form.password, {
    role: "faculty",
    full_name: form.fullName.trim(),
    faculty_number: form.facultyNumber.trim(),
    department: form.department.trim(),
    id_document_path: upload.path,
  });
}

async function signUp(role: Role, email: string, password: string, data: Record<string, string>) {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: confirmRedirect(role), data },
  });

  if (error) {
    if (error.code === "user_already_exists") return "This email already has an account. Sign in instead, or use Forgot Password.";
    if (error.code === "over_email_send_rate_limit") return "Too many sign-up attempts. Please wait a few minutes and try again.";
    if (error.status === 500 || error.code === "unexpected_failure") {
      return role === "student"
        ? "We couldn't create your account. This Student ID may already be registered. If it's yours, contact support."
        : "We couldn't create your account. This Faculty ID may already be registered. If it's yours, contact support.";
    }
    return error.message;
  }

  await supabase.auth.signOut();
  return null;
}
