import type { APIRoute } from "astro";
import { renderIcon } from "../lib/share-card";

/** Home-screen icons: Apple reads apple-touch-icon.png, Android the manifest's two sizes. */
const SIZES: Record<string, number> = { "apple-touch-icon": 180, "icon-192": 192, "icon-512": 512 };

export function getStaticPaths() {
  return Object.keys(SIZES).map((icon) => ({ params: { icon } }));
}

export const GET: APIRoute = async ({ params }) =>
  new Response(await renderIcon(SIZES[params.icon ?? "icon-512"]), {
    headers: { "Content-Type": "image/png" },
  });
