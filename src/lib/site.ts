export const SITE_NAME = "Solfege Piano";

export const SITE_TITLE = "Solfege Piano | Free Online Piano";

export const SITE_OG_IMAGE_ALT =
  "Solfege Piano: an interactive online piano for ear training";

export const SITE_DESCRIPTION =
  "Practice piano, solfege, ear training, and music theory online with an interactive keyboard, realistic samples, sustain, note labels, and audio effects.";

const FALLBACK_SITE_URL = "https://solfegepiano.vercel.app";

function normalizeSiteUrl(value: string): string {
  const url =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return url.replace(/\/$/, "");
}

const configuredUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
const vercelProductionUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = normalizeSiteUrl(
  configuredUrl ?? vercelProductionUrl ?? FALLBACK_SITE_URL,
);
