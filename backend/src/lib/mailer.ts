import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function smtp(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465, // 465 = SSL; 587/2525 = STARTTLS
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email over SMTP. When SMTP isn't configured (local development) the
 * message is printed to the console instead, so flows can still be tested.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  if (!env.mailEnabled) {
    console.log(`[mail] SMTP not configured — would send to ${message.to}:\n${message.text}`);
    return;
  }
  const info = await smtp().sendMail({ from: env.smtp.from, ...message });
  console.log(`[mail] sent "${message.subject}" to ${message.to} (${info.response})`);
}
