/**
 * Token helpers + upload utility.
 * All data fetching has moved to the RTK Query apiSlice (fetchBaseQuery).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000/api";

const TOKEN_KEY = "bn_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Download an authenticated file (e.g. a CSV export) and save it in the
 * browser. A plain link can't carry the Bearer token, so fetch it as a blob.
 */
export async function downloadFile(
  path: string,
  params: Record<string, string | undefined>,
  fallbackName: string
): Promise<void> {
  const query = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]))
  ).toString();
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}${query ? `?${query}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const d = await res.json();
      message = d?.error ?? d?.message ?? message;
    } catch { /* non-JSON */ }
    throw new Error(message);
  }
  const name =
    res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Upload one image (seller-authenticated). Returns its public URL. */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("image", file);
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new Error(
      `Cannot reach the server at ${API_BASE}. Make sure the backend is running.`
    );
  }
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const d = await res.json();
      message = d?.message ?? message;
    } catch { /* non-JSON */ }
    throw new Error(message);
  }
  return res.json();
}
