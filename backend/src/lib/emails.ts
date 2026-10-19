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

/* --------------------------------- Orders --------------------------------- */

/** What the order emails need — a plain shape so templates stay model-free. */
export interface OrderEmailData {
  id: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export type OrderEmailStatus = "confirmed" | "shipped" | "delivered" | "cancelled";

/** Same short reference buyers see on the site, e.g. #9E6C1F. */
export const orderNumber = (id: string) => `#${id.slice(-6).toUpperCase()}`;

const rs = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

const COD_NOTE =
  "Payment is Cash on Delivery — pay only when your order arrives. Never pay anything upfront, even if someone asks.";

/** Items table, totals and delivery address shared by every order email. */
function orderSummary(o: OrderEmailData) {
  const cell = "padding:8px 0;border-bottom:1px solid #e2e8f0";
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="${cell}">${escapeHtml(i.name)} <span style="color:#64748b">× ${i.quantity}</span></td>
        <td style="${cell};text-align:right;white-space:nowrap">${rs(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");
  const html = `
  <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    ${rows}
    <tr><td style="padding:8px 0;color:#64748b">Subtotal</td><td style="padding:8px 0;text-align:right">${rs(o.subtotal)}</td></tr>
    <tr><td style="padding:0 0 8px;color:#64748b">Delivery</td><td style="padding:0 0 8px;text-align:right">${o.deliveryFee ? rs(o.deliveryFee) : "Free"}</td></tr>
    <tr><td style="padding:10px 0;border-top:2px solid #1b3a5b;font-weight:bold">Total</td><td style="padding:10px 0;border-top:2px solid #1b3a5b;text-align:right;font-weight:bold;font-size:16px">${rs(o.total)}</td></tr>
  </table>
  <p style="font-size:14px;margin:0 0 4px"><strong>Delivering to</strong></p>
  <p style="font-size:14px;color:#475569;margin:0">${escapeHtml(o.customerName)} · ${escapeHtml(o.customerPhone)}<br>${escapeHtml(o.customerAddress)}, ${escapeHtml(o.customerCity)}</p>
  <p style="font-size:13px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:10px;padding:10px 12px;margin:16px 0 0">${COD_NOTE}</p>`;

  const text = [
    ...o.items.map((i) => `- ${i.name} × ${i.quantity}: ${rs(i.price * i.quantity)}`),
    `Subtotal: ${rs(o.subtotal)}`,
    `Delivery: ${o.deliveryFee ? rs(o.deliveryFee) : "Free"}`,
    `Total: ${rs(o.total)}`,
    "",
    `Delivering to: ${o.customerName}, ${o.customerPhone}, ${o.customerAddress}, ${o.customerCity}`,
    "",
    COD_NOTE,
  ].join("\n");
  return { html, text };
}

function orderEmail(
  o: OrderEmailData,
  opts: { subject: string; heading: string; intro: string }
): EmailContent {
  const summary = orderSummary(o);
  const ordersLink = appLink("/orders");
  const footnote = `Questions about your order? Contact ${escapeHtml(o.storeName)} on WhatsApp from your order page, or reply to this email.`;
  return {
    subject: opts.subject,
    text: [
      `Hi ${o.customerName},`,
      "",
      opts.intro,
      "",
      `Order ${orderNumber(o.id)} from ${o.storeName}`,
      summary.text,
      "",
      `View your orders: ${ordersLink}`,
    ].join("\n"),
    html: layout({
      heading: opts.heading,
      body: `<p>Hi ${escapeHtml(o.customerName)},</p>
  <p>${escapeHtml(opts.intro)}</p>
  <p style="font-size:13px;color:#64748b;margin:16px 0 0">Order <strong style="color:#1e293b">${orderNumber(o.id)}</strong> · ${escapeHtml(o.storeName)}</p>
  ${summary.html}`,
      button: { label: "View my orders", href: ordersLink },
      footnote,
    }),
  };
}

/** Sent to the buyer right after checkout. */
export function orderPlacedEmail(o: OrderEmailData): EmailContent {
  return orderEmail(o, {
    subject: `Order received ${orderNumber(o.id)} — ${o.storeName}`,
    heading: "Thanks for your order!",
    intro: `We've received your order and sent it to ${o.storeName}. You'll get another email as soon as the shop confirms it.`,
  });
}

const STATUS_COPY: Record<OrderEmailStatus, { subject: string; heading: string; intro: (store: string) => string }> = {
  confirmed: {
    subject: "Your order is confirmed",
    heading: "Your order is confirmed",
    intro: (store) => `Good news — ${store} has confirmed your order and is getting it ready.`,
  },
  shipped: {
    subject: "Your order is on its way",
    heading: "Your order is on its way",
    intro: (store) => `${store} has sent your order. Please keep the cash ready to pay when it arrives.`,
  },
  delivered: {
    subject: "Your order has been delivered",
    heading: "Your order has been delivered",
    intro: (store) => `Your order from ${store} has been delivered. We hope you love it — thanks for shopping on Bazaarnagar!`,
  },
  cancelled: {
    subject: "Your order was cancelled",
    heading: "Your order was cancelled",
    intro: (store) => `${store} has cancelled this order. You won't be charged anything. If you didn't expect this, please contact the shop.`,
  },
};

/** Sent to the buyer when the seller moves the order to a new status. */
export function orderStatusEmail(o: OrderEmailData, status: OrderEmailStatus): EmailContent {
  const copy = STATUS_COPY[status];
  return orderEmail(o, {
    subject: `${copy.subject} ${orderNumber(o.id)} — ${o.storeName}`,
    heading: copy.heading,
    intro: copy.intro(o.storeName),
  });
}
