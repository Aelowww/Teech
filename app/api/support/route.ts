import { NextResponse, type NextRequest } from "next/server";
import { answersFor, type SupportAudience } from "@/app/mobile/_components/support-answers";

const model = "gemini-2.5-flash";
const windowMs = 10 * 60 * 1000;
const maxRequests = 15;
const globalWindowMs = 60 * 60 * 1000;
const maxGlobalRequests = 200;
const recentRequests = new Map<string, number[]>();
let globalRequests: number[] = [];

const audienceLabels: Record<SupportAudience, string> = {
  student: "a student",
  faculty: "a faculty member",
  guest: "a visitor who is not signed in yet",
};

function isRateLimited(key: string) {
  const now = Date.now();
  globalRequests = globalRequests.filter((time) => now - time < globalWindowMs);
  if (globalRequests.length >= maxGlobalRequests) return true;
  if (recentRequests.size > 5000) recentRequests.clear();
  const recent = (recentRequests.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= maxRequests) {
    recentRequests.set(key, recent);
    return true;
  }
  recentRequests.set(key, [...recent, now]);
  globalRequests.push(now);
  return false;
}

function clientAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded?.[forwarded.length - 1] || request.headers.get("x-real-ip") || "local";
}

function instructionsFor(audience: SupportAudience) {
  const facts = answersFor(audience).map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`).join("\n\n");
  return [
    "You are Teech Support, the help assistant inside Teech, a web app where students book consultations with faculty. Faculty publish available dates and rooms, students request a time, and faculty confirm or decline.",
    `The person asking is ${audienceLabels[audience]}.`,
    "Answer questions about using Teech, based on the facts below. If a question has nothing to do with Teech or school consultations, kindly say you can only help with Teech. If it is about Teech or consultations but the facts don't cover it, don't say you can only help with Teech; say you're not sure and suggest asking the faculty member, their instructor, or the system administrator.",
    "You cannot see or change accounts, bookings, or passwords. Never ask for passwords, Student IDs, or personal information.",
    "Reply in plain text with no markdown, in under 80 words, friendly and clear. Match the user's language: English, Filipino, or Taglish.",
    `Facts:\n${facts}`,
  ].join("\n\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Support AI is not configured." }, { status: 503 });

  const body = await request.json().catch(() => null) as { message?: unknown; audience?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const audience = body?.audience === "student" || body?.audience === "faculty" ? body.audience : "guest";
  if (!message || message.length > 300) return NextResponse.json({ error: "Please send a question under 300 characters." }, { status: 400 });

  if (isRateLimited(clientAddress(request))) return NextResponse.json({ error: "You've asked a lot of questions. Please try again in a few minutes." }, { status: 429 });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructionsFor(audience) }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return NextResponse.json({ error: "Support AI is unavailable right now." }, { status: 502 });

    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!reply) return NextResponse.json({ error: "Support AI did not return an answer." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Support AI is unavailable right now." }, { status: 504 });
  }
}
