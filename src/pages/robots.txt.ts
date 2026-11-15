import type { APIRoute } from "astro";
import { robotsTxt } from "../lib/share";

export const GET: APIRoute = () =>
  new Response(robotsTxt(), { headers: { "Content-Type": "text/plain" } });
