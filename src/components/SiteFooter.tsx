import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * Site-wide footer.
 *
 * Minimal, non-intrusive footer anchored at the bottom of the viewport.
 */
export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-2.5 z-30 flex justify-center px-4 text-xs tracking-wide">
      <div className="pointer-events-auto flex items-center gap-2 text-current opacity-60 transition-opacity duration-200 hover:opacity-100">
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
