import type { OrderDoc } from "../models/Order";
import { Customer } from "../models/Customer";
import { sendMail } from "./mailer";
import {
  orderPlacedEmail,
  orderStatusEmail,
  type EmailContent,
  type OrderEmailData,
  type OrderEmailStatus,
} from "./emails";

/** Email typed at checkout, else the logged-in buyer's account email. */
async function buyerEmail(order: OrderDoc): Promise<string | undefined> {
  if (order.customerEmail) return order.customerEmail;
  if (!order.customerId) return undefined;
  const customer = await Customer.findById(order.customerId).select("email");
  return customer?.email;
}

function emailData(order: OrderDoc, storeName: string): OrderEmailData {
  return {
    id: order.id,
    storeName,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    customerCity: order.customerCity,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    // Orders placed before subtotal was stored don't have it.
    subtotal: order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0),
    deliveryFee: order.deliveryFee ?? 0,
    total: order.total,
  };
}

/**
 * Send in the background: a mail problem must never fail checkout or a
 * seller's status update. Orders without a buyer email are skipped.
 */
function deliver(order: OrderDoc, build: () => EmailContent, label: string) {
  buyerEmail(order)
    .then((to) => (to ? sendMail({ to, ...build() }) : undefined))
    .catch((err) => console.error(`Failed to send ${label} email for order ${order.id}:`, err));
}

export function sendOrderPlacedEmail(order: OrderDoc, storeName: string) {
  deliver(order, () => orderPlacedEmail(emailData(order, storeName)), "order placed");
}

const EMAILED_STATUSES = new Set<string>(["confirmed", "shipped", "delivered", "cancelled"]);

export function sendOrderStatusEmail(order: OrderDoc, storeName: string) {
  if (!EMAILED_STATUSES.has(order.status)) return;
  const status = order.status as OrderEmailStatus;
  deliver(order, () => orderStatusEmail(emailData(order, storeName), status), `order ${status}`);
}
