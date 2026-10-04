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

const legacyStudentDomain = "@students.teech.local";

export async function signInAs(role: Role, emailInput: string, password: string): Promise<SignInResult> {
  const supabase = createClient();
  let email = emailInput.trim().toLowerCase();

  if (role === "student" && /^\d{6}$/.test(email)) {
    const { data: resolved } = await supabase.rpc("resolve_sign_in", { requested_role: "student", identifier: email, password });
    const match = (resolved as { status: string; email: string | null }[] | null)?.[0];
    if (match?.status === "locked") return { ok: false, error: "Too many incorrect attempts. Try again later, or reset your password." };
    if (match?.status !== "ok" || !match.email?.endsWith(legacyStudentDomain)) return { ok: false, error: "Incorrect email or password." };
    email = match.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: "Your email isn't confirmed yet. Go to Sign up and enter the same details to get a new 6-digit code." };
    }
    if (error?.code === "invalid_credentials") return { ok: false, error: "Incorrect email or password." };
    if (error?.code === "over_request_rate_limit") return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
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

  if (role === "faculty") {
    const { data: profile } = await supabase.from("profiles").select("verification_status").eq("auth_user_id", data.user.id).maybeSingle();
    if (profile?.verification_status === "pending") {
      await supabase.auth.signOut();
      return { ok: false, error: "Your account is waiting for admin verification. We'll email you as soon as your Faculty ID is approved." };
    }
  }

  return { ok: true };
}

export async function resendConfirmation(role: Role, email: string) {
  const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmRedirect(role) } });
  if (!error) return null;
  return error.code === "over_email_send_rate_limit" ? "Please wait a minute before requesting another email." : error.message;
}

type StudentSignUp = { fullName: string; email: string; password: string };
type FacultySignUp = { fullName: string; email: string; facultyNumber: string; department: string; password: string; idFile: File | null };

export async function signUpStudent(form: StudentSignUp) {
  return createAccount("student", form.email, form.password, {
    role: "student",
    full_name: form.fullName.trim(),
  });
}

export async function signUpFaculty(form: FacultySignUp) {
  const fileError = facultyIdFileError(form.idFile);
  if (fileError || !form.idFile) return { error: fileError, needsCode: false };
  const idFile = form.idFile;
  const facultyNumber = form.facultyNumber.trim();
  return createAccount("faculty", form.email, form.password, {
    role: "faculty",
    full_name: form.fullName.trim(),
    faculty_number: facultyNumber,
    department: form.department.trim(),
  }, () => submitFacultyId(idFile, facultyNumber));
}

export async function verifyEmailCode(email: string, code: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
  if (error) return otpErrorMessage(error);
  await supabase.auth.signOut();
  return null;
}

export async function verifyFacultyEmailCode(email: string, code: string, idFile: File, facultyNumber: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
  if (error) return { error: otpErrorMessage(error), uploadFailed: false };
  if (await submitFacultyId(idFile, facultyNumber.trim())) return { error: null, uploadFailed: true };
  await supabase.auth.signOut();
  return { error: null, uploadFailed: false };
}

function otpErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "otp_expired") return "That code has expired or isn't right. Check the latest email or request a new code.";
  if (error.code === "over_request_rate_limit") return "Too many attempts. Please wait a minute and try again.";
  return error.message;
}

async function submitFacultyId(idFile: File, facultyNumber: string) {
  const upload = await uploadFacultyId(idFile);
  if (!upload.path) return upload.error;
  const { data, error } = await createClient().rpc("submit_my_verification", { new_identifier: facultyNumber, document_path: upload.path, new_department: null });
  return error || data !== "ok" ? "We couldn't submit your Faculty ID." : null;
}

type CreateResult = { error: string | null; needsCode: boolean };

async function createAccount(role: Role, email: string, password: string, data: Record<string, string>, afterSession?: () => Promise<string | null>): Promise<CreateResult> {
  const supabase = createClient();
  const { data: created, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: confirmRedirect(role), data },
  });

  const fail = (message: string): CreateResult => ({ error: message, needsCode: false });
  if (error) {
    if (error.code === "user_already_exists") return fail("This email already has an account. Sign in instead, or use Forgot Password.");
    if (error.code === "over_email_send_rate_limit") return fail("Too many sign-up attempts. Please wait a few minutes and try again.");
    if (error.status === 500 || error.code === "unexpected_failure") {
      return fail(role === "student"
        ? "We couldn't create your account. This Student ID may already be registered. If it's yours, contact support."
        : "We couldn't create your account. This Faculty ID may already be registered. If it's yours, contact support.");
    }
    return fail(error.message);
  }

  if (created.user && created.user.identities?.length === 0) return fail("This email already has an account. Sign in instead, or use Forgot Password.");

  if (created.session) {
    const submitError = afterSession ? await afterSession() : null;
    await supabase.auth.signOut();
    if (submitError) return fail("Your account was created, but we couldn't upload your Faculty ID. Sign in to upload it again.");
    return { error: null, needsCode: false };
  }
  return { error: null, needsCode: true };
}
