export type SupportAudience = "student" | "faculty" | "guest";

export type SupportAnswer = {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  action?: { label: string; href: string };
  audiences: SupportAudience[];
};

export const supportAnswers: SupportAnswer[] = [
  {
    id: "book",
    question: "How do I book a consultation?",
    keywords: ["book", "booking", "request", "consult", "consultation", "appointment", "schedule", "meet", "mag book", "magbook", "pa book", "konsulta", "magpakonsulta", "paano mag book"],
    answer: "Open the Faculty tab, pick a faculty member with open dates, choose a date and time, then add your reason and submit. The faculty member will confirm or decline it, and you'll get a notification either way.",
    action: { label: "Find faculty", href: "/student/faculty" },
    audiences: ["student"],
  },
  {
    id: "cant-book",
    question: "Why can't I book a time?",
    keywords: ["why cant", "why can t", "cant book", "can t book", "cannot book", "unable to book", "cant", "can t", "cannot", "unable", "unavailable", "limit", "full", "taken", "error", "blocked", "hindi makapag book", "di makabook", "hindi ako makapag book", "ayaw mag book"],
    answer: "A few things can block a booking: the slot was just taken by someone else, you already have a pending request with that faculty member, you already have 3 pending requests, or you have another consultation at the same time. Cancel or wait for a response on an older request, then try again.",
    action: { label: "View my requests", href: "/student/appointment-requests" },
    audiences: ["student"],
  },
  {
    id: "cancel-student",
    question: "How do I cancel a request?",
    keywords: ["cancel", "cancellation", "remove", "withdraw", "change", "kanselahin", "ikansela", "i cancel"],
    answer: "Go to Requests and tap Cancel on the request, or open it and tap Cancel Consultation. You can cancel pending and confirmed requests, and the faculty member is notified right away.",
    action: { label: "Open requests", href: "/student/appointment-requests" },
    audiences: ["student"],
  },
  {
    id: "where",
    question: "Where do I meet the faculty member?",
    keywords: ["where", "room", "location", "place", "venue", "office", "saan", "kwarto", "silid", "saan ang"],
    answer: "The meeting room is set by the faculty member for each available date. Open the request from Requests to see When and Where.",
    action: { label: "Open requests", href: "/student/appointment-requests" },
    audiences: ["student"],
  },
  {
    id: "expired",
    question: "Why did my request expire?",
    keywords: ["expire", "expired", "no response", "unanswered", "ignored", "nag expire", "wala sagot"],
    answer: "Requests that aren't answered by their date expire automatically overnight, so the time slot opens up again. Feel free to book a new date.",
    action: { label: "Find faculty", href: "/student/faculty" },
    audiences: ["student"],
  },
  {
    id: "availability",
    question: "How do I set my available dates?",
    keywords: ["availability", "available", "dates", "calendar", "open", "schedule", "slots", "hours", "time", "oras", "petsa", "bakante"],
    answer: "Go to Manage Availability, select one or more dates on the calendar, set the start and end time, and add the meeting room. The room is required so students know where to go. Students can book once you save.",
    action: { label: "Manage availability", href: "/faculty/availability" },
    audiences: ["faculty"],
  },
  {
    id: "respond",
    question: "How do I respond to requests?",
    keywords: ["respond", "confirm", "approve", "accept", "decline", "reject", "requests", "pending", "tanggapin", "aprubahan", "sagutin"],
    answer: "Open Requests and tap a request to see the student's details and reason, then tap Confirm or Decline. The student is notified immediately. Answering within 24 hours helps you earn the Quick Responder badge.",
    action: { label: "Open requests", href: "/faculty/requests" },
    audiences: ["faculty"],
  },
  {
    id: "cancel-faculty",
    question: "Can I cancel a confirmed consultation?",
    keywords: ["cancel", "cancellation", "cant attend", "can t attend", "reschedule", "emergency", "kanselahin", "ikansela", "hindi makakapunta"],
    answer: "Yes. Open the confirmed request and tap Cancel Consultation. The student gets a notification that you cancelled, and the time slot opens up again.",
    action: { label: "Open requests", href: "/faculty/requests" },
    audiences: ["faculty"],
  },
  {
    id: "expired-faculty",
    question: "Why can't I confirm an old request?",
    keywords: ["expired", "old", "past", "cant confirm", "confirm"],
    answer: "Requests whose date has already passed can't be confirmed anymore. You can decline them to clear them from your list, or they expire automatically overnight.",
    action: { label: "Open requests", href: "/faculty/requests" },
    audiences: ["faculty"],
  },
  {
    id: "password-student",
    question: "I forgot my password",
    keywords: ["forgot", "password", "reset", "recover", "recovery", "locked", "login", "sign in", "nakalimutan", "limot", "password ko"],
    answer: "On the sign-in page, tap Forgot Password and enter the email you signed up with. We'll send you a secure link to choose a new password. Check your spam folder if it doesn't arrive.",
    action: { label: "Reset my password", href: "/student/forgot-password" },
    audiences: ["student"],
  },
  {
    id: "password-faculty",
    question: "I forgot my password",
    keywords: ["forgot", "password", "reset", "recover", "recovery", "email", "login", "sign in", "nakalimutan", "limot", "password ko"],
    answer: "On the sign-in page, tap Forgot Password and enter your email. We'll send you a secure link to choose a new password. Check your spam folder if it doesn't arrive.",
    action: { label: "Reset my password", href: "/faculty/forgot-password" },
    audiences: ["faculty"],
  },
  {
    id: "password-guest",
    question: "I forgot my password",
    keywords: ["forgot", "password", "reset", "recover", "recovery", "locked", "cant sign in", "cant login", "nakalimutan", "limot", "password ko"],
    answer: "Tap Forgot Password on the student or faculty sign-in page and enter your email. We'll send you a link to choose a new password.",
    action: { label: "Student password help", href: "/student/forgot-password" },
    audiences: ["guest"],
  },
  {
    id: "student-id",
    question: "My Student ID isn't working",
    keywords: ["student id", "id", "number", "digits", "invalid", "wrong", "not working", "student number", "mali id"],
    answer: "Student IDs are exactly 6 digits, like 000123. Make sure you're on the student sign-in page, not the faculty one. If you've never created an account, tap Sign Up first.",
    action: { label: "Create a student account", href: "/student/create-account" },
    audiences: ["guest"],
  },
  {
    id: "sign-up",
    question: "How do I create an account?",
    keywords: ["create", "account", "sign up", "signup", "register", "new", "join", "gumawa", "mag register", "gawa account"],
    answer: "Pick your role on the start screen. Students sign up with their 6-digit Student ID; faculty sign up with their email. Your password needs at least 8 characters with uppercase, lowercase, a number, and a symbol.",
    action: { label: "Choose your role", href: "/welcome" },
    audiences: ["guest"],
  },
  {
    id: "what-is",
    question: "What is Teech?",
    keywords: ["what is teech", "teech", "about", "purpose"],
    answer: "Teech lets students book consultations with faculty without the back-and-forth. Faculty post the dates and rooms they're free, students pick a slot, and faculty confirm or decline.",
    audiences: ["guest", "student", "faculty"],
  },
  {
    id: "points",
    question: "How do points and streaks work?",
    keywords: ["points", "pts", "streak", "check in", "checkin", "daily", "coins", "earn", "freeze", "puntos"],
    answer: "Opening the app each day checks you in. Check-ins pay 5 to 25 points, rising each day of your streak, and every badge adds 20 more. Spend points on streak freezes, which cover a missed day, or collectible badges.",
    action: { label: "Exchange points", href: "/{role}/points" },
    audiences: ["student", "faculty"],
  },
  {
    id: "badges",
    question: "How do I get badges?",
    keywords: ["badge", "badges", "achievement", "award", "showcase", "unlock"],
    answer: "Badges unlock as you use Teech: login streaks, adding a photo, completing consultations, and more. Some can be redeemed with points. You can show up to 3 on your profile.",
    action: { label: "See my badges", href: "/{role}/profile/badges" },
    audiences: ["student", "faculty"],
  },
  {
    id: "profile",
    question: "How do I change my name or photo?",
    keywords: ["name", "photo", "picture", "avatar", "profile", "edit", "email", "update", "change", "palitan", "litrato", "pangalan"],
    answer: "Go to Profile → Personal Information and tap Edit. You can change your photo and details there.",
    action: { label: "Edit profile", href: "/{role}/profile/edit" },
    audiences: ["student", "faculty"],
  },
  {
    id: "delete",
    question: "How do I delete my account?",
    keywords: ["delete", "remove account", "close account", "deactivate", "burahin", "tanggalin account"],
    answer: "Go to Profile and tap Delete Account at the bottom of the list, then type DELETE to confirm. This permanently removes your profile and consultation history, and anyone with an upcoming consultation with you is notified.",
    action: { label: "Open profile", href: "/{role}/profile" },
    audiences: ["student", "faculty"],
  },
];

const smallTalk = [
  {
    keywords: ["hi", "hello", "hey", "yo", "good morning", "good afternoon", "good evening", "kumusta", "musta", "hola"],
    reply: "Hi there! I can help with booking, requests, passwords, points, and more. What do you need?",
  },
  {
    keywords: ["thanks", "thank you", "thank", "ty", "thx", "salamat", "tnx", "appreciate"],
    reply: "You're welcome! Anything else I can help you with?",
  },
  {
    keywords: ["who are you", "what are you", "watchu", "whatchu", "whatcha", "wyd", "what are you doing", "how are you", "are you a bot", "are you real", "real person", "human", "bot"],
    reply: "I'm Teech's help assistant. I'm not a real person, but I'm here all day answering questions about using Teech. Ask me about booking, requests, passwords, points, or badges.",
  },
  {
    keywords: ["bye", "goodbye", "see you", "later", "ok bye", "paalam"],
    reply: "Glad I could help! You can open this chat again anytime.",
  },
];

const weakKeywords = new Set(["appointment", "consultation", "consult", "request", "requests", "account", "time", "id", "number", "profile", "change", "update", "email", "login", "sign in"]);

const fallback = "Sorry, I don't have an answer for that yet. Try one of the questions below, or ask your instructor or system administrator for help.";

export type SupportReply = {
  text: string;
  action?: { label: string; href: string };
  answerId?: string;
  related: SupportAnswer[];
  matched: boolean;
};

export function answersFor(audience: SupportAudience) {
  return supportAnswers.filter((entry) => entry.audiences.includes(audience));
}

function normalize(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function withinOneEdit(first: string, second: string) {
  if (Math.abs(first.length - second.length) > 1) return false;
  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < first.length && j < second.length) {
    if (first[i] === second[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (first.length === second.length && first[i] === second[j + 1] && first[i + 1] === second[j]) {
      i += 2;
      j += 2;
      continue;
    }
    if (first.length > second.length) i++;
    else if (first.length < second.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (first.length - i) + (second.length - j) <= 1;
}

function matches(normalized: string, words: string[], keyword: string) {
  if (normalized.includes(` ${keyword} `)) return true;
  if (keyword.includes(" ")) return false;
  return keyword.length >= 5 && words.some((word) => word.length >= 4 && withinOneEdit(word, keyword));
}

function score(normalized: string, words: string[], keywords: string[]) {
  return keywords.reduce((total, keyword) => {
    if (!matches(normalized, words, keyword)) return total;
    return total + keyword.split(" ").length * (weakKeywords.has(keyword) ? 0.5 : 1);
  }, 0);
}

function ranked(text: string, audience: SupportAudience) {
  const normalized = normalize(text);
  const words = normalized.trim().split(" ");
  return answersFor(audience)
    .map((entry) => ({ entry, points: score(normalized, words, entry.keywords) }))
    .filter((item) => item.points > 0)
    .sort((first, second) => second.points - first.points);
}

function related(text: string, audience: SupportAudience, excludeId?: string) {
  const matchesFound = ranked(text, audience).map((item) => item.entry).filter((entry) => entry.id !== excludeId);
  const defaults = answersFor(audience).filter((entry) => entry.id !== excludeId && !matchesFound.includes(entry));
  return [...matchesFound, ...defaults].slice(0, 3);
}

function withRole(action: SupportAnswer["action"], audience: SupportAudience) {
  if (!action) return undefined;
  return { label: action.label, href: action.href.replace("{role}", audience === "guest" ? "" : audience) };
}

export function respond(text: string, audience: SupportAudience, chosen?: SupportAnswer): SupportReply {
  const answer = chosen || ranked(text, audience).find((item) => item.points >= 1)?.entry;
  if (answer) {
    return { text: answer.answer, action: withRole(answer.action, audience), answerId: answer.id, related: related(answer.question, audience, answer.id), matched: true };
  }
  const normalized = normalize(text);
  const words = normalized.trim().split(" ");
  const chat = smallTalk
    .map((entry) => ({ entry, points: score(normalized, words, entry.keywords) }))
    .sort((first, second) => second.points - first.points)[0];
  if (chat && chat.points > 0) {
    return { text: chat.entry.reply, related: related(text, audience), matched: true };
  }
  return { text: fallback, related: related(text, audience), matched: false };
}
