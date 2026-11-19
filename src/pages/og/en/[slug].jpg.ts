import type { APIRoute } from "astro";
import { CITIES } from "../../../lib/cities";
import { renderShareCard } from "../../../lib/share-card";

// English share pictures, under the Over There name: lib/share.ts points English pages here.

export function getStaticPaths() {
  return [
    { params: { slug: "home" }, props: { city: undefined } },
    ...CITIES.map((city) => ({ params: { slug: city.slug }, props: { city } })),
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderShareCard(
    props.city ? { kind: "city", city: props.city } : { kind: "home" },
    "en",
  );
  return new Response(png, { headers: { "Content-Type": "image/jpeg" } });
};
