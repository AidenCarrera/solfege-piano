import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${SITE_NAME} handles your data: no accounts, no cookies, no personal data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12 pb-24">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <h1 className="mb-6 text-3xl font-bold tracking-tight">Privacy</h1>

      <div className="flex flex-col gap-4 leading-relaxed opacity-90">
        <p>
          We use{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            Vercel Web Analytics
          </a>{" "}
          to understand how the site is used. It provides anonymous,
          aggregated page-view metrics without using cookies or tracking
          visitors across different websites.
        </p>

        <p>
          Your settings, including background color, octave range, effects, and
          preferences, are saved in your browser&rsquo;s local storage so the
          piano opens the way you left it. They remain on your device, are not
          sent to {SITE_NAME}, and are not used to identify you. Clearing the
          site&rsquo;s stored data in your browser removes them.
        </p>
      </div>
    </main>
  );
}
