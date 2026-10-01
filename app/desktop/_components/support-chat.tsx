"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, ChevronRight, MessageCircleQuestion, ShieldCheck, X } from "lucide-react";
import { KiteIcon } from "@/app/desktop/_components/kite-icon";
import { answersFor, respond, type SupportAnswer, type SupportAudience } from "@/app/desktop/_components/support-answers";
<<<<<<< HEAD
=======
import { maxQuestionLength } from "@/lib/support";
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
import styles from "./support-chat.module.css";

type Message = { id: number; from: "bot" | "user"; text: string; action?: { label: string; href: string } };

const greeting = "Hi! I'm the Teech helper. Ask me anything about using Teech, or pick a question below.";

export function SupportChat({ audience, variant, className }: { audience: SupportAudience; variant: "floating" | "row" | "link"; className?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", text: greeting }]);
  const [suggestions, setSuggestions] = useState<SupportAnswer[]>(() => answersFor(audience).slice(0, 5));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function askGemini(question: string) {
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, audience }),
      });
      const data = await response.json() as { reply?: string; error?: string };
<<<<<<< HEAD
      return data.reply || data.error || null;
=======
      if (data.reply) return data.reply;
      return response.status === 429 ? data.error || null : null;
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
    } catch {
      return null;
    }
  }

  async function reply(question: string, chosen?: SupportAnswer) {
    const response = respond(question, audience, chosen);
    setMessages((current) => [...current, { id: current.length, from: "user", text: question }]);
    setTyping(true);
    const [aiReply] = await Promise.all([
      response.matched ? Promise.resolve(null) : askGemini(question),
      new Promise((resolve) => window.setTimeout(resolve, 450)),
    ]);
    setTyping(false);
    setMessages((current) => [...current, { id: current.length, from: "bot", text: aiReply || response.text, action: response.action }]);
    setSuggestions(response.related);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || typing) return;
    setInput("");
    void reply(question);
  }

  const trigger = variant === "floating"
    ? <button className={styles.floating} type="button" onClick={() => setOpen(true)} aria-label="Open help chat"><KiteIcon size={24} /></button>
    : variant === "row"
      ? <button className={`${className || ""} ${styles.row}`} type="button" onClick={() => setOpen(true)}><span><MessageCircleQuestion size={15} />Help &amp; Support</span><ChevronRight size={16} /></button>
      : <button className={`${className || ""} ${styles.link}`} type="button" onClick={() => setOpen(true)}><MessageCircleQuestion size={14} />Need help? Chat with us</button>;

  return (
    <>
      {trigger}
      {open && createPortal(
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-label="Teech help chat" onMouseDown={(event) => event.stopPropagation()}>
            <span className={styles.handle} aria-hidden="true" />
            <header className={styles.header}>
              <span className={styles.avatar}><KiteIcon size={20} /></span>
              <div>
                <strong>Teech Support</strong>
                <small><i className={styles.online} aria-hidden="true" />Instant answers to common questions</small>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close help chat"><X size={18} /></button>
            </header>
            <div className={styles.thread} ref={threadRef} aria-live="polite">
              {messages.map((message) => message.from === "bot"
                ? (
                  <div className={styles.botRow} key={message.id}>
                    <span className={styles.botAvatar} aria-hidden="true"><KiteIcon size={13} /></span>
                    <div className={styles.bot}>
                      <p>{message.text}</p>
                      {message.action && <Link className={styles.action} href={message.action.href} onClick={() => setOpen(false)}>{message.action.label}<ChevronRight size={13} /></Link>}
                    </div>
                  </div>
                )
                : <div className={styles.user} key={message.id}><p>{message.text}</p></div>)}
              {typing && (
                <div className={styles.botRow}>
                  <span className={styles.botAvatar} aria-hidden="true"><KiteIcon size={13} /></span>
                  <div className={`${styles.bot} ${styles.typing}`} aria-label="Typing"><span /><span /><span /></div>
                </div>
              )}
              {!typing && suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <p className={styles.suggestionsLabel}>Suggested questions</p>
                  {suggestions.map((entry) => (
                    <button type="button" key={entry.id} onClick={() => void reply(entry.question, entry)}>
                      <span>{entry.question}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form className={styles.composer} onSubmit={submit}>
              <div className={styles.composerField}>
<<<<<<< HEAD
                <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" maxLength={200} aria-label="Your question" />
=======
                <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" maxLength={maxQuestionLength} aria-label="Your question" />
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
                <button type="submit" disabled={!input.trim() || typing} aria-label="Send"><ArrowUp size={17} strokeWidth={2.4} /></button>
              </div>
              <p className={styles.notice}><ShieldCheck size={11} aria-hidden="true" />Questions I can&apos;t answer are sent to Google Gemini. Please don&apos;t share personal information.</p>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
