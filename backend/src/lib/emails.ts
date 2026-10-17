import { env } from "../config/env";

/** Email templates. Each returns a subject plus matching plain-text and HTML bodies. */
export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export const RESET_TTL_MINUTES = 30;

/** Absolute link into the frontend, e.g. appLink("/dashboard"). */
export function appLink(path: string): string {
  return `${env.appUrl.replace(/\/$/, "")}${path}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Shared branded wrapper: heading, body paragraphs/lists, one button, footnote. */
function layout(opts: { heading: string; body: string; button: { label: string; href: string }; footnote: string }) {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1e293b;line-height:1.5">
  <p style="font-size:20px;font-weight:bold;margin:0 0 20px">
    <span style="color:#1b3a5b">Bazaar</span><span style="color:#e85d2c">nagar</span>
  </p>
  <h2 style="color:#1b3a5b;margin:0 0 12px">${opts.heading}</h2>
  ${opts.body}
  <p style="margin:28px 0">
    <a href="${opts.button.href}" style="background:#1b3a5b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${opts.button.label}</a>
  </p>
  <p style="font-size:13px;color:#64748b">${opts.footnote}</p>
</div>`;
}

const listHtml = (items: string[]) =>
  `<ol style="padding-left:20px;margin:0">${items.map((i) => `<li style="margin-bottom:6px">${i}</li>`).join("")}</ol>`;

export function resetPasswordEmail(name: string, link: string): EmailContent {
  const footnote = `The link expires in ${RESET_TTL_MINUTES} minutes and can only be used once. If you didn't ask for this, you can ignore this email — your password won't change.`;
  return {
    subject: "Reset your Bazaarnagar password",
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your Bazaarnagar password. Open this link to choose a new one:",
      link,
      "",
      footnote,
    ].join("\n"),
    html: layout({
      heading: "Reset your password",
      body: `<p>Hi ${escapeHtml(name)},</p>
  <p>We received a request to reset your Bazaarnagar password. Click the button below to choose a new one.</p>
  <p style="font-size:13px;color:#64748b">Or copy this link into your browser:<br><a href="${link}" style="color:#e85d2c;word-break:break-all">${link}</a></p>`,
      button: { label: "Reset password", href: link },
      footnote,
    }),
  };
}

export function welcomeSellerEmail(name: string): EmailContent {
  const dashboard = appLink("/dashboard");
  const steps = [
    "Set up your store profile — name, logo, WhatsApp number and location.",
    "Add your products with photos and prices.",
    "Share your store link with customers on WhatsApp, Facebook and Instagram.",
  ];
  const footnote = "Questions? Just reply to this email — we're happy to help.";
  return {
    subject: "Welcome to Bazaarnagar — let's set up your shop",
    text: [
      `Hi ${name},`,
      "",
      "Welcome to Bazaarnagar! Your seller account is ready, and you're on the free plan.",
      "",
      "Get your shop online in three steps:",
      ...steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      `Go to your dashboard: ${dashboard}`,
      "",
      footnote,
    ].join("\n"),
    html: layout({
      heading: `Welcome to Bazaarnagar, ${escapeHtml(name)}!`,
      body: `<p>Your seller account is ready, and you're on the <strong>free plan</strong>. Get your shop online in three steps:</p>
  ${listHtml(steps)}`,
      button: { label: "Go to your dashboard", href: dashboard },
      footnote,
    }),
  };
}

export function welcomeBuyerEmail(name: string): EmailContent {
  const shop = appLink("/search");
  const perks = [
    "Discover products from local shops near you.",
    "Save favourites to your wishlist.",
    "Chat with sellers and track your orders in one place.",
  ];
  const footnote = "Questions? Just reply to this email — we're happy to help.";
  return {
    subject: "Welcome to Bazaarnagar!",
    text: [
      `Hi ${name},`,
      "",
      "Welcome to Bazaarnagar! Your account is ready. Here's what you can do:",
      ...perks.map((p) => `- ${p}`),
      "",
      `Start shopping: ${shop}`,
      "",
      footnote,
    ].join("\n"),
    html: layout({
      heading: `Welcome to Bazaarnagar, ${escapeHtml(name)}!`,
      body: `<p>Your account is ready. Here's what you can do:</p>
  <ul style="padding-left:20px;margin:0">${perks.map((p) => `<li style="margin-bottom:6px">${p}</li>`).join("")}</ul>`,
      button: { label: "Start shopping", href: shop },
      footnote,
    }),
  };
}
