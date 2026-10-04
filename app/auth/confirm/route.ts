import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const otpTypes = new Set<EmailOtpType>(["signup", "email", "invite", "magiclink", "email_change"]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = params.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
  const portal = safeNext.startsWith("/faculty") ? "faculty" : "student";
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let confirmed = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  } else if (tokenHash && type && otpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmed = !error;
  }

  if (confirmed) {
    if (portal === "faculty") await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return NextResponse.redirect(new URL(`/${portal}/sign-in?confirm=failed`, request.url));
}
