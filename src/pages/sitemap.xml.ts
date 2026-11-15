import type { APIRoute } from "astro";
import { sitemapPaths, sitemapXml } from "../lib/share";

export const GET: APIRoute = () =>
  new Response(sitemapXml(sitemapPaths()), { headers: { "Content-Type": "application/xml" } });
