import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

type Contact = { role: "student" | "faculty"; full_name: string; email: string; verification_status: string; verification_note: string | null };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] as string);
}

function layout(siteUrl: string, title: string, heading: string, body: string, buttonLabel: string, buttonUrl: string, footer: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f4f3fb;font-family:'DM Sans',Arial,Helvetica,sans-serif;color:#28294a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f3fb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;"><tr><td align="center" style="padding:0 0 20px;">
<img src="${siteUrl}/logo/teech_logo_email.png" width="150" alt="Teech" style="display:block;width:150px;height:auto;border:0;" />
<div style="margin-top:6px;font-size:13px;font-style:italic;color:#8586a0;">Teacher within your reach</div>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e7e6f1;border-radius:20px;">
<tr><td style="padding:32px 32px 0;text-align:center;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#28294a;">${heading}</h1></td></tr>
<tr><td style="padding:12px 32px 0;text-align:center;font-size:15px;line-height:1.6;color:#5d5f80;">${body}</td></tr>
<tr><td style="padding:24px 32px 16px;text-align:center;"><a href="${buttonUrl}" style="display:inline-block;padding:13px 32px;background-color:#7772c9;border-radius:999px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${buttonLabel}</a></td></tr>
<tr><td style="padding:8px 32px 32px;text-align:center;"><p style="margin:0;padding-top:20px;border-top:1px solid #efeef7;font-size:12px;line-height:1.6;color:#a3a4bd;">${footer}</p></td></tr>
</table>
<p style="margin:20px 0 0;font-size:12px;color:#a3a4bd;">Teech · Student and faculty consultations</p>
</td></tr></table></body></html>`;
}

function compose(contact: Contact, siteUrl: string) {
  const label = contact.role === "student" ? "Student ID" : "Faculty ID";
  const signInUrl = `${siteUrl}/${contact.role}/sign-in`;
  const name = escapeHtml(contact.full_name);
  const footer = "You're receiving this because you have a Teech account. If you have questions, reply to your school's Teech administrator.";

  if (contact.verification_status === "verified") {
    const body = contact.role === "faculty"
      ? "Your Faculty ID has been verified. Your Teech account is ready, so you can now sign in with your email and password."
      : "Your Student ID has been verified. You can now book consultations on Teech.";
    return {
      subject: "Your Teech account is verified",
      text: `Hi ${contact.full_name},

${body}

Sign in: ${signInUrl}

Teech`,
      html: layout(siteUrl, "Your Teech account is verified", "You're verified", `<p style="margin:0;">Hi ${name},</p><p style="margin:12px 0 0;">${body}</p>`, "Sign in to Teech", signInUrl, footer),
    };
  }

  const reason = contact.verification_note || "The details you submitted didn't match our records.";
  const nextStep = `Sign in to Teech to correct your details and upload a new photo of your ${label}.`;
  return {
    subject: `We couldn't verify your ${label}`,
    text: `Hi ${contact.full_name},

We couldn't verify your ${label}.

Reason: ${reason}

${nextStep}

Sign in: ${signInUrl}

Teech`,
    html: layout(
      siteUrl,
      `We couldn't verify your ${label}`,
      `We couldn't verify your ${label}`,
      `<p style="margin:0;">Hi ${name},</p><p style="margin:16px 0 0;padding:12px 14px;text-align:left;color:#8f2a38;background-color:#fff1f3;border:1px solid #f6d3da;border-radius:12px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p><p style="margin:16px 0 0;">${nextStep}</p>`,
      "Update my details",
      signInUrl,
      footer,
    ),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { profileId?: unknown } | null;
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";
  if (!uuidPattern.test(profileId)) return NextResponse.json({ sent: false, reason: "invalid" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_account_contact", { target_profile_id: profileId });
  if (error) {
    console.error("[verification-email] admin_account_contact failed:", error);
    return NextResponse.json({ sent: false, reason: "forbidden" }, { status: 403 });
  }

  const contact = (data as Contact[] | null)?.[0];
  if (!contact) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });
  if (contact.verification_status !== "verified" && contact.verification_status !== "rejected") return NextResponse.json({ sent: false, reason: "pending" });
  if (!contact.email || contact.email.endsWith("@students.teech.local")) return NextResponse.json({ sent: false, reason: "no_email" });

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return NextResponse.json({ sent: false, reason: "not_configured" });

  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
  const message = compose(contact, siteUrl);
  const sent = await transport
    .sendMail({ from: `Teech <${user}>`, to: contact.email, subject: message.subject, text: message.text, html: message.html })
    .then(() => true)
    .catch((sendError) => {
      console.error("[verification-email] sendMail failed:", sendError);
      return false;
    });

  if (!sent) return NextResponse.json({ sent: false, reason: "send_failed" }, { status: 502 });
  return NextResponse.json({ sent: true });
}
