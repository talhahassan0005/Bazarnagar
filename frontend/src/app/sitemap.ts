import type { MetadataRoute } from "next";
import { SITE_DOMAIN } from "@/lib/constants";
import { API_BASE } from "@/lib/api";

const BASE_URL = `https://${SITE_DOMAIN}`;

async function getStoreSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/public/stores`, { cache: "no-store" });
    const stores = (await res.json()) as { slug: string }[];
    return stores.map((s) => s.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1 },
    { url: `${BASE_URL}/shops`, priority: 0.8 },
    { url: `${BASE_URL}/search`, priority: 0.8 },
    { url: `${BASE_URL}/about`, priority: 0.5 },
    { url: `${BASE_URL}/how-it-works`, priority: 0.5 },
    { url: `${BASE_URL}/terms`, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, priority: 0.3 },
  ];

  const slugs = await getStoreSlugs();
  const storePages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/store/${slug}`,
    priority: 0.6,
  }));

  return [...staticPages, ...storePages];
}
