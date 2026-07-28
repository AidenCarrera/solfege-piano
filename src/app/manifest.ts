import { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { DEFAULT_THEME_COLOR } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    // A portrait phone is barely two octaves wide once the keys are legible,
    // so an installed copy opens the way the keyboard is meant to be played.
    orientation: "landscape",
    lang: "en-US",
    categories: ["education", "music"],
    background_color: DEFAULT_THEME_COLOR,
    theme_color: DEFAULT_THEME_COLOR,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
