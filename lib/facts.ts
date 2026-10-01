import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Lightbulb, MessagesSquare, type LucideIcon } from "lucide-react";

export type FactKind = "Did you know?" | "Study tip" | "Consultation tip" | "Teaching tip";
export type Fact = { kind: FactKind; text: string };

const trivia: Fact[] = [
  { kind: "Did you know?", text: "Hermann Ebbinghaus described the \"forgetting curve\" in 1885. Memories fade fastest in the first few days after learning, unless you review them." },
  { kind: "Did you know?", text: "The word \"school\" comes from the Greek scholē, which originally meant leisure or free time." },
  { kind: "Did you know?", text: "The University of Bologna, founded in 1088, is considered the oldest university in continuous operation." },
  { kind: "Did you know?", text: "The Socratic method, learning by answering guided questions, is named after the Greek philosopher Socrates." },
  { kind: "Did you know?", text: "In medieval libraries, books were so valuable that many were chained to their shelves to prevent theft." },
  { kind: "Did you know?", text: "Your brain uses about 20% of your body's energy, even though it makes up only around 2% of your body weight." },
  { kind: "Did you know?", text: "Hymen Lipman received a patent in 1858 for attaching an eraser to the end of a pencil." },
  { kind: "Did you know?", text: "At Oxford and Cambridge, much of the teaching happens in small tutorials, called supervisions at Cambridge, with just a few students per teacher." },
  { kind: "Did you know?", text: "The word \"consult\" comes from the Latin consulere, meaning to deliberate or to ask for advice." },
];

const studentTips: Fact[] = [
  { kind: "Study tip", text: "Spacing out your review over several days helps you remember more than cramming the same hours into one night. Psychologists call this the spacing effect." },
  { kind: "Study tip", text: "Testing yourself with practice questions strengthens memory more than re-reading your notes. This is known as retrieval practice." },
  { kind: "Consultation tip", text: "Write down your questions before a consultation. A short list helps you use every minute with your teacher." },
  { kind: "Study tip", text: "The Pomodoro Technique pairs 25 minutes of focused work with a 5-minute break. It was created by Francesco Cirillo in the late 1980s." },
  { kind: "Consultation tip", text: "Bring your work to a consultation, like a draft, a solution or your code, so your teacher can give feedback on the real thing." },
  { kind: "Study tip", text: "Sleep helps your brain consolidate what you learned during the day. A good night's rest is part of studying." },
  { kind: "Study tip", text: "Mixing different kinds of problems in one practice session, called interleaving, helps you tell them apart on exams." },
  { kind: "Consultation tip", text: "Ask for specific feedback, like \"What would make this answer stronger?\" Specific questions get more useful answers." },
  { kind: "Study tip", text: "Explaining a topic in your own words, as if teaching someone else, is one of the best ways to find gaps in your understanding." },
  { kind: "Consultation tip", text: "Jot down a short summary right after a consultation. You'll remember the advice far better later." },
  { kind: "Study tip", text: "Pairing words with diagrams, known as dual coding, gives your memory two ways to find the same idea." },
  { kind: "Study tip", text: "Information you produce yourself, like answering a question before checking, sticks better than information you only read. This is the generation effect." },
  { kind: "Consultation tip", text: "Ask for help early. A small question today is easier to fix than a big gap right before an exam." },
  { kind: "Study tip", text: "Mnemonics such as PEMDAS turn hard-to-remember lists into short, memorable phrases." },
  { kind: "Consultation tip", text: "If you can't make it to a booked consultation, cancel early so another student can take the slot." },
];

const facultyTips: Fact[] = [
  { kind: "Teaching tip", text: "Start a consultation by asking what the student has already tried. It shows you where they're stuck and keeps the session focused." },
  { kind: "Teaching tip", text: "Short, low-stakes quizzes help students remember more. Retrieval practice works in class as well as in private study." },
  { kind: "Consultation tip", text: "Publishing open dates a week or more ahead gives students time to prepare questions before they book." },
  { kind: "Teaching tip", text: "Specific feedback, like pointing to one paragraph and one fix, is easier for students to act on than general comments." },
  { kind: "Teaching tip", text: "Asking students to explain an idea back in their own words is a quick way to check real understanding." },
  { kind: "Consultation tip", text: "Setting your status to In a meeting or Busy helps students know when to wait instead of sending a request." },
  { kind: "Teaching tip", text: "Giving students a few seconds of wait time after a question often leads to longer, more thoughtful answers." },
  { kind: "Teaching tip", text: "Revisiting key ideas across several weeks, rather than once, helps students keep them long after the exam." },
  { kind: "Consultation tip", text: "Ending a consultation with one clear next step helps students leave knowing exactly what to work on." },
  { kind: "Teaching tip", text: "Worked examples followed by similar practice problems help beginners build confidence before solving on their own." },
  { kind: "Consultation tip", text: "Confirming or declining requests quickly lets students plan their week and look for another slot if needed." },
];

export const factKinds: Record<FactKind, { Icon: LucideIcon; tone: string }> = {
  "Did you know?": { Icon: Lightbulb, tone: "amber" },
  "Study tip": { Icon: BookOpen, tone: "green" },
  "Consultation tip": { Icon: MessagesSquare, tone: "violet" },
  "Teaching tip": { Icon: GraduationCap, tone: "blue" },
};

export const factHour = 60 * 60 * 1000;

function mix(tips: Fact[]) {
  const result: Fact[] = [];
  const longest = Math.max(tips.length, trivia.length);
  for (let index = 0; index < longest; index++) {
    if (index < tips.length) result.push(tips[index]);
    if (index < trivia.length) result.push(trivia[index]);
  }
  return result;
}

export const factsByRole = { student: mix(studentTips), faculty: mix(facultyTips) };

export function useRotatingFact(role: "student" | "faculty") {
  const facts = factsByRole[role];
  const [now, setNow] = useState(() => Date.now());
  const [shuffle, setShuffle] = useState(() => ({ hour: Math.floor(Date.now() / factHour), offset: 0 }));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const activeHour = Math.floor(now / factHour);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), factHour - (Date.now() % factHour) + 250);
    return () => window.clearTimeout(timer);
  }, [activeHour]);
  const offset = shuffle.hour === activeHour ? shuffle.offset : 0;
  const fact = facts[(activeHour + offset) % facts.length];
  return {
    fact,
    ...factKinds[fact.kind],
    elapsed: (now % factHour) / factHour,
    minutesLeft: Math.ceil((factHour - (now % factHour)) / 60000),
    next: () => setShuffle({ hour: activeHour, offset: offset + 1 }),
  };
}
