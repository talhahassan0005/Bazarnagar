/**
 * Remembers which orders THIS browser has placed, so the guest "My Orders"
 * page can show order history without a login — and, importantly, without a
 * phone-number lookup that would let anyone browse a stranger's orders and
 * delivery address. Only orders this device actually placed are ever shown.
 */
const KEY = "bn_my_orders";
const MAX_REMEMBERED = 50;

export function rememberOrder(orderId: string): void {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const existing = getRememberedOrderIds();
    const next = [orderId, ...existing.filter((id) => id !== orderId)].slice(0, MAX_REMEMBERED);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — safe to ignore.
  }
}

export function getRememberedOrderIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}
