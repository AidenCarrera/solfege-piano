import type { Metadata } from "next";

export const SITE_NAME = "Solfege Piano";

export const SITE_TITLE = "Solfege Piano | Free Online Piano";

export const SITE_OG_IMAGE_ALT =
  "Solfege Piano: an interactive online piano for ear training";

export const SITE_DESCRIPTION =
  "Practice piano, solfege, ear training, and music theory online with an interactive keyboard, realistic samples, sustain, note labels, and audio effects.";

const FALLBACK_SITE_URL = "https://solfege.aidencarrera.com";

function normalizeSiteUrl(value: string): string {
  const url =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return url.replace(/\/$/, "");
}

// Server-only module, so the plain (non-NEXT_PUBLIC) variables are enough.
export const SITE_URL = normalizeSiteUrl(
  process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    FALLBACK_SITE_URL,
);

export function canonicalUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export const SITE_OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "en_US",
  type: "website",
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: SITE_OG_IMAGE_ALT,
    },
  ],
} satisfies Metadata["openGraph"];
