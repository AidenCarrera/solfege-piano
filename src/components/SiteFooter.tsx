import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * Site-wide footer.
 *
 * In normal flow at the end of the document, not pinned to the viewport: on a
 * phone the page scrolls to reach a full-screen keyboard, and a fixed footer
 * would ride along on top of the keys the whole way down. The body is a
 * min-height column with `main` growing, so on a screen tall enough to hold
 * everything this still lands at the bottom of the first screen.
 */
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
          // The focus ring is a box-shadow, which forced-colors mode strips.
          // The outline utility below is the variant that leaves a transparent
          // 2px outline in that mode, keeping the focus state visible; the
          // one that simply removes the outline would leave no indicator.
          className="transition-colors hover:underline focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-current rounded px-1"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
