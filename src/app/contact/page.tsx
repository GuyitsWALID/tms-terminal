"use client";

import { FormEvent, useState } from "react";

const SUPPORT_EMAIL = "vibetrading2026@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("Please complete name, email, and message.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Sending your message...");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(payload.error || "Unable to send your message right now.");
        return;
      }

      setStatus("Message sent successfully. We will get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("Unable to send your message right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="ff-panel p-5">
        <h1 className="font-rajdhani text-3xl font-bold uppercase text-[var(--ink-primary)]">Contact</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Reach out for support, partnership requests, or account-related concerns. We typically respond in the order received.
        </p>
      </section>

      <section className="ff-panel p-5">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Support Email</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink-primary)]">{SUPPORT_EMAIL}</span>
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">All contact form submissions are addressed to this inbox.</p>
      </section>

      <section className="ff-panel p-5">
        <h2 className="ff-panel-title text-sm text-[var(--ink-primary)]">Email Form</h2>
        <form onSubmit={onSubmit} className="mt-3 grid gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-10 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-sm text-[var(--ink-primary)] outline-none"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="h-10 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-sm text-[var(--ink-primary)] outline-none"
            required
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-10 rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 text-sm text-[var(--ink-primary)] outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            rows={6}
            className="rounded border border-[var(--line-soft)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--ink-primary)] outline-none"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex w-fit rounded bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
          >
            {isSubmitting ? "Sending..." : "Send Email"}
          </button>
          {status ? <p className="text-xs text-[var(--ink-muted)]">{status}</p> : null}
        </form>
      </section>
    </div>
  );
}
