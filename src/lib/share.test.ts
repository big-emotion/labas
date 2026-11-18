// @vitest-environment node
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { renderShareCard } from "./share-card";
import {
  SITE,
  absoluteUrl,
  canonicalUrl,
  robotsTxt,
  shareImageFor,
  siteDescription,
  sitemapPaths,
  sitemapXml,
} from "./share";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

/** Format and size of a share picture, read back from its bytes. */
async function pictureOf(bytes: Uint8Array) {
  const { format, width, height } = await sharp(bytes).metadata();
  return { format, width, height, kilobytes: bytes.byteLength / 1024 };
}

describe("links shared on social networks and read by search engines", () => {
  it("are absolute on labas.africa", () => {
    expect(absoluteUrl("/og/home.jpg")).toBe(`${SITE}/og/home.jpg`);
    expect(absoluteUrl("/")).toBe(`${SITE}/`);
  });

  it("name each page by the address the server answers without a redirect: a folder, with its slash", () => {
    expect(canonicalUrl("/ville/dakar")).toBe(`${SITE}/ville/dakar/`);
    expect(canonicalUrl("/ville/dakar/")).toBe(`${SITE}/ville/dakar/`);
    expect(canonicalUrl("/methode/index.html")).toBe(`${SITE}/methode/`);
    expect(canonicalUrl("/")).toBe(`${SITE}/`);
  });

  it("show a city's own picture on its page and the home picture everywhere else", () => {
    expect(shareImageFor("/ville/dakar/")).toBe(`${SITE}/og/dakar.jpg`);
    expect(shareImageFor("/methode")).toBe(`${SITE}/og/home.jpg`);
    expect(shareImageFor("/")).toBe(`${SITE}/og/home.jpg`);
  });

  it("describe the quiz without a fixed number of questions, with the real city count", () => {
    expect(siteDescription("fr")).not.toMatch(/dix questions/);
    expect(siteDescription("fr")).toContain(`${CITIES.length} villes`);
    expect(siteDescription("en")).toContain(`${CITIES.length} cities`);
  });

  it("name an English page by its English address", () => {
    expect(canonicalUrl("/en/city/dakar")).toBe(`${SITE}/en/city/dakar/`);
    expect(shareImageFor("/en/city/dakar/")).toBe(`${SITE}/og/en/dakar.jpg`);
    expect(shareImageFor("/en/")).toBe(`${SITE}/og/en/home.jpg`);
  });
});

describe("the sitemap", () => {
  it("lists the public pages and every city", () => {
    const paths = sitemapPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/approfondir/");
    expect(paths).toContain("/methode/");
    expect(paths).toContain("/villes/");
    for (const city of CITIES) expect(paths).toContain(`/ville/${city.slug}/`);
  });

  it("lists every public page in English too", () => {
    const paths = sitemapPaths();
    expect(paths).toContain("/en/");
    expect(paths).toContain("/en/go-deeper/");
    for (const city of CITIES) expect(paths).toContain(`/en/city/${city.slug}/`);
  });

  it("is valid sitemap XML with absolute addresses", () => {
    const xml = sitemapXml(["/", "/ville/dakar/"]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain(`<loc>${SITE}/ville/dakar/</loc>`);
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it("is announced by robots.txt, which leaves every page open", () => {
    const robots = robotsTxt();
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robots).not.toContain("Disallow");
  });
});

// Rendering loads fonts and photos and encodes a JPEG: seconds on a busy CI runner, where the
// 5 s default failed the v0.12.1 deploy.
describe("the share pictures", { timeout: 30_000 }, () => {
  // Light enough for a phone on a slow network, well under every network's 5 MB limit.
  it("render the home picture as a 1200 × 630 JPEG under 300 KB", async () => {
    const jpeg = await renderShareCard({ kind: "home" });
    expect([...jpeg.slice(0, 3)]).toEqual(JPEG_SIGNATURE);
    const picture = await pictureOf(jpeg);
    expect(picture).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
    expect(picture.kilobytes).toBeLessThan(300);
  });

  it("render a city picture, photo credited, as a 1200 × 630 JPEG under 300 KB", async () => {
    const dakar = CITIES.find((city) => city.slug === "dakar")!;
    const picture = await pictureOf(await renderShareCard({ kind: "city", city: dakar }));
    expect(picture).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
    expect(picture.kilobytes).toBeLessThan(300);
  });

  it("render a city without a photo too", async () => {
    const bare = CITIES.find((city) => city.slug === "teyateyaneng")!;
    const picture = await pictureOf(await renderShareCard({ kind: "city", city: bare }));
    expect(picture).toMatchObject({ format: "jpeg", width: 1200, height: 630 });
  });

  it("render the app icon as a square PNG at the asked size", async () => {
    const { renderIcon } = await import("./share-card");
    const png = await renderIcon(180);
    expect(pngSize(png)).toEqual({ width: 180, height: 180 });
  });
});
