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
          {SITE_NAME} does not collect personal data. There are no accounts, no
          cookies, and no advertising or cross-site tracking.
        </p>

        <p>
          The one third-party service is{" "}
          <a
            href="https://vercel.com/docs/speed-insights/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            Vercel Speed Insights
          </a>
          , which records anonymous performance measurements such as page load
          time, browser, and country. It does not use cookies and cannot
          identify you.
        </p>

        <p>
          Your settings (background colour, octave range, effects, and
          preferences) are saved in your own browser&rsquo;s local storage so
          the piano opens the way you left it. They never leave your device, are
          not sent to any server, and are not used to identify you. Clearing
          your browser&rsquo;s site data removes them.
        </p>
      </div>
    </main>
  );
}
