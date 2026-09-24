import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import { THEME_SCRIPT } from "@/lib/theme";
import {
  canonicalUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_ALT,
  SITE_OPEN_GRAPH,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import { DEFAULT_THEME_COLOR } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  category: "education",
  keywords: [
    "online piano",
    "solfege",
    "ear training",
    "do re mi",
    "music theory",
    "piano practice",
    "solfege practice",
    "virtual piano",
  ],
  authors: [{ name: "Aiden Carrera" }],
  creator: "Aiden Carrera",
  publisher: "Aiden Carrera",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...SITE_OPEN_GRAPH,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: canonicalUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@aidencarrera",
    images: [
      {
        url: "/og-image.png",
        alt: SITE_OG_IMAGE_ALT,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  verification: {
    google: "ivXP4BMnsO5q10Rcb1-RDmAgpQmwBQR-d4ckfFDQB9c",
  },
};

export const viewport: Viewport = {
  themeColor: DEFAULT_THEME_COLOR,
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${SITE_URL}/#application`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with Web Audio support",
  inLanguage: "en-US",
  isAccessibleForFree: true,
  image: `${SITE_URL}/og-image.png`,
  featureList: [
    "Interactive online piano keyboard",
    "Piano and sung solfege samples",
    "Movable-do solfege labels in any key and scale",
    "Ear-training practice with scoring",
    "Live note, interval, and chord names",
    "Keyboard, mouse, touch, and MIDI controls",
    "Sustain and configurable audio effects",
    "Adjustable note labels and octave range",
  ],
  author: {
    "@type": "Person",
    name: "Aiden Carrera",
  },
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
  },
};

// Escaping "<" keeps the serialised payload from closing the script element early.
const SERIALIZED_JSON_LD = JSON.stringify(JSON_LD).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The pre-paint theme script mutates this element before hydration.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} flex min-h-svh flex-col antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: SERIALIZED_JSON_LD }}
        />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
