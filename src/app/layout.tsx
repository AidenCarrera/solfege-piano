import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solfege Piano",
  description:
    "An interactive browser-based piano that lets you play notes and hear solfege syllables (do, re, mi, etc.) or real piano tones. Built with Next.js, React, and Howler.js.",
  keywords: [
    "piano",
    "solfege",
    "music education",
    "ear training",
    "Next.js",
    "React",
    "Howler.js",
    "music app",
  ],
  authors: [{ name: "Aiden Carrera" }],
  openGraph: {
    title: "Solfege Piano",
    description:
      "Play solfege solfege or piano notes right in your browser — an interactive music education tool built by Aiden Carrera.",
    url: "https://solfege-piano.vercel.app",
    siteName: "Solfege Piano",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}