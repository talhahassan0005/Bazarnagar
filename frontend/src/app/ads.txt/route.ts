import { API_BASE } from "@/lib/api";

/**
 * Serves /ads.txt dynamically from the admin's Ad Settings, so the
 * AdSense-required publisher line updates automatically whenever the
 * publisher ID changes — no manual redeploy needed.
 */
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/public/ad-settings`, { cache: "no-store" });
    const settings = (await res.json()) as { adsensePublisherId?: string };
    const pubId = settings.adsensePublisherId?.replace(/^ca-/, "");

    const body = pubId ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n` : "";
    return new Response(body, { headers: { "Content-Type": "text/plain" } });
  } catch {
    return new Response("", { headers: { "Content-Type": "text/plain" } });
  }
}
