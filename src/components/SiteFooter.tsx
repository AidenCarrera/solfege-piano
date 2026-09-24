import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    // Keep the height in sync with PIANO_INSET.FOOTER_PX.
    <footer className="flex h-10 shrink-0 items-center justify-center px-4 text-xs tracking-wide">
      <div className="flex items-center gap-2 text-current opacity-60 transition-opacity duration-200 hover:opacity-100">
        <span>
          © {currentYear} {SITE_NAME}
        </span>
        <span aria-hidden="true">•</span>
        <Link
          href="/privacy"
          className="transition-colors hover:underline focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-current rounded px-1"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
