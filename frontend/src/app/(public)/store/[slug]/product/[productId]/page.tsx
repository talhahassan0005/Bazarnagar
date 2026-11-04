import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/constants";
import { ProductDetailClient } from "./ProductDetailClient";

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE}/public/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const product = await fetchProduct(productId);

  if (!product) {
    return { title: `Product · ${SITE_NAME}` };
  }

  const title = `${product.name} · ${product.store?.name ?? SITE_NAME}`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.name} from ${product.store?.name ?? SITE_NAME} on Bazarnagar.`;
  const image = product.images?.[0] ?? null;
  const url = `https://${SITE_DOMAIN}/store/${slug}/product/${productId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(image ? { images: [{ url: image, width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
