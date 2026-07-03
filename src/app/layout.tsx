import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { SITE_URL } from "@/lib/config";
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
  title: {
    default: "Solfege Piano",
    template: "%s | Solfege Piano",
  },
  description:
    "Play solfege or piano notes right in your browser. An interactive music education tool built for ear training and theory learning.",
  keywords: [
    "piano",
    "solfege",
    "music education",
    "ear training",
    "nextjs piano",
    "online piano",
    "do re mi",
    "music theory",
    "browser piano",
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
    title: "Solfege Piano",
    description:
      "An interactive browser-based piano that lets you play notes and hear solfege syllables. Perfect for music students and teachers.",
    url: SITE_URL,
    siteName: "Solfege Piano",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solfege Piano - Interactive Browser Piano",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solfege Piano",
    description: "Play solfege or piano notes right in your browser.",
    creator: "@aidencarrera",
    images: ["/og-image.png"],
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "ivXP4BMnsO5q10Rcb1-RDmAgpQmwBQR-d4ckfFDQB9c",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Solfege Piano",
    description:
      "An interactive browser-based piano for learning solfege and music theory.",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: "Aiden Carrera",
    },
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
