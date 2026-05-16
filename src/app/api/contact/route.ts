import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const SUPPORT_EMAIL = process.env.CONTACT_TO_EMAIL ?? "vibetrading2026@gmail.com";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? "";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

const trimValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = trimValue(body.name);
  const email = trimValue(body.email);
  const subject = trimValue(body.subject) || "Support Request";
  const message = trimValue(body.message);

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Email service is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL." },
      { status: 500 }
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  const text = `New contact form submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
`;

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, "<br/>")}</p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text,
      html,
    });

    if (error) {
      return NextResponse.json({ error: `Email provider rejected request: ${error.message}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const messageText = error instanceof Error ? error.message : "Unknown email send error";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
