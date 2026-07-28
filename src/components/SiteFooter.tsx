import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex shrink-0 justify-center px-4 py-3 text-xs tracking-wide">
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
