import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Contact = { role: "student" | "faculty"; full_name: string; email: string; verification_status: string; verification_note: string | null };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] as string);
}

function compose(contact: Contact, siteUrl: string) {
  const label = contact.role === "student" ? "Student ID" : "Faculty ID";
  const signInUrl = `${siteUrl}/${contact.role}/sign-in`;
  const name = escapeHtml(contact.full_name);

  if (contact.verification_status === "verified") {
    const body = contact.role === "faculty"
      ? "Your Faculty ID has been verified. Your Teech account is ready, so you can now sign in with your Faculty ID and password."
      : "Your Student ID has been verified. You can now book consultations on Teech.";
    return {
      subject: "Your Teech account is verified",
      text: `Hi ${contact.full_name},\n\n${body}\n\nSign in: ${signInUrl}\n\nTeech`,
      html: `<p>Hi ${name},</p><p>${body}</p><p><a href="${signInUrl}">Sign in to Teech</a></p><p>Teech</p>`,
    };
  }

  const reason = contact.verification_note || "The details you submitted didn't match our records.";
  const nextStep = `Sign in with your ${label} and password to correct your details${contact.role === "faculty" ? " and upload a new photo of your Faculty ID" : ""}.`;
  return {
    subject: `We couldn't verify your ${label}`,
    text: `Hi ${contact.full_name},\n\nWe couldn't verify your ${label}.\n\nReason: ${reason}\n\n${nextStep}\n\nSign in: ${signInUrl}\n\nTeech`,
    html: `<p>Hi ${name},</p><p>We couldn't verify your ${label}.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><p>${nextStep}</p><p><a href="${signInUrl}">Sign in to Teech</a></p><p>Teech</p>`,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { profileId?: unknown } | null;
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";
  if (!uuidPattern.test(profileId)) return NextResponse.json({ sent: false, reason: "invalid" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_account_contact", { target_profile_id: profileId });
  if (error) return NextResponse.json({ sent: false, reason: "forbidden" }, { status: 403 });

  const contact = (data as Contact[] | null)?.[0];
  if (!contact) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });
  if (contact.verification_status !== "verified" && contact.verification_status !== "rejected") return NextResponse.json({ sent: false, reason: "pending" });
  if (!contact.email || contact.email.endsWith("@students.teech.local")) return NextResponse.json({ sent: false, reason: "no_email" });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return NextResponse.json({ sent: false, reason: "not_configured" });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
  const message = compose(contact, siteUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [contact.email], subject: message.subject, text: message.text, html: message.html }),
  }).catch(() => null);

  if (!response?.ok) return NextResponse.json({ sent: false, reason: "send_failed" }, { status: 502 });
  return NextResponse.json({ sent: true });
}
