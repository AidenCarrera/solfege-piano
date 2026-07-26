import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
    default: "Solfege Piano | Free Online Piano",
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
    title: "Solfege Piano | Free Online Piano",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solfege Piano — an interactive online piano for ear training",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solfege Piano | Free Online Piano",
    description: SITE_DESCRIPTION,
    creator: "@aidencarrera",
    images: [
      {
        url: "/og-image.png",
        alt: "Solfege Piano — an interactive online piano for ear training",
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
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
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
      "Keyboard, mouse, and touch controls",
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
  const serializedJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializedJsonLd }}
        />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
