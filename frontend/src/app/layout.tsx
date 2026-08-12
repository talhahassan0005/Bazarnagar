import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { API_BASE } from "@/lib/api";
import { Providers } from "@/store/Providers";
import { AdSenseScript } from "@/components/domain/AdSenseScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Ties the <meta name="google-adsense-account"> tag to the admin's saved publisher ID. */
async function getAdsensePublisherId(): Promise<string | undefined> {
  try {
    const res = await fetch(`${API_BASE}/public/ad-settings`, { cache: "no-store" });
    const settings = (await res.json()) as { adsenseEnabled?: boolean; adsensePublisherId?: string };
    return settings.adsenseEnabled ? settings.adsensePublisherId : undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const adsensePublisherId = await getAdsensePublisherId();
  return {
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s · ${SITE_NAME}`,
    },
    description:
      "Create a public catalog link, upload products, and take orders on WhatsApp.",
    ...(adsensePublisherId && { other: { "google-adsense-account": adsensePublisherId } }),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AdSenseScript />
          {children}
        </Providers>
      </body>
    </html>
  );
}
