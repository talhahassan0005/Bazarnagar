import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/constants";
import { StorePageClient } from "./StorePageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchStore(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/public/stores/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchStore(slug);

  if (!store) {
    return { title: `Shop · ${SITE_NAME}` };
  }

  const title = `${store.name} · ${SITE_NAME}`;
  const description = store.description
    ? store.description.slice(0, 160)
    : `Browse products from ${store.name} on ${SITE_NAME}.`;
  const image = store.coverUrl ?? store.logoUrl ?? null;
  const url = `https://${SITE_DOMAIN}/store/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: store.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function PublicStorePage() {
  return <StorePageClient />;
}
