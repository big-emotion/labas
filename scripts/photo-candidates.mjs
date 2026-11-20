/**
 * Finds free-licensed photos of a city for its slideshow, in two steps a person (or an agent)
 * runs around their own look at the pictures:
 *
 *   node scripts/photo-candidates.mjs find "Le Cap" "Afrique du Sud" le-cap "Cape Town" "Bo-Kaap"
 *     → .photo-staging/le-cap/candidates.json, cNN.jpg and numbered contact sheets
 *   node scripts/photo-candidates.mjs apply cotonou
 *     → reads .photo-staging/cotonou/picks.json, writes public/photos/cotonou-NN.jpg and the
 *       city's entries in src/data/city-photos.json
 *
 * The licence, the author and the source come from the APIs, never from the person choosing:
 * what a photo shows is a judgement, what it may be used for is not. Only licences that allow
 * reuse and resizing with credit are kept (CC BY, CC BY-SA, CC0, public domain): no NC, since a
 * paid part is planned, and no ND, since the site resizes.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AGENT = "labas-photo-research/1.0";
const STAGING = ".photo-staging";
const WIDTH = 1024;
const MOST = 48;
const FREE = /^(cc[ -]by(-sa)?[ -]\d|cc0|public domain|pdm|by|by-sa)\b/i;
const NOT_A_VIEW =
  /\b(map|carte|flag|drapeau|logo|coat of arms|blason|locator|plan|diagram|stamp|timbre|portrait|seal|emblem|chart|graph|satellite|landsat|sentinel|iss0)\b/i;

const text = (html = "") =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// One stamp shared by every run on this machine, next to the script rather than in the working
// folder: several checkouts searching at once were refused by Commons (429) within a minute.
const PACE_FILE = fileURLToPath(new URL("../.photo-staging/.pace", import.meta.url));
const PACE = 1500;

/** Waits for this machine's turn: at most one request every PACE ms, all runs together. */
async function turn() {
  await mkdir(dirname(PACE_FILE), { recursive: true });
  const last = existsSync(PACE_FILE) ? Number(await readFile(PACE_FILE, "utf8")) || 0 : 0;
  const mine = Math.max(Date.now(), last + PACE);
  await writeFile(PACE_FILE, String(mine));
  await sleep(mine - Date.now());
}

/** A paced request that waits out a refusal (429, 5xx) instead of giving up on the city. */
async function request(url) {
  for (let attempt = 0; ; attempt++) {
    await turn();
    const response = await fetch(url, { headers: { "user-agent": AGENT } });
    if (response.ok || attempt === 5 || (response.status !== 429 && response.status < 500))
      return response;
    const asked = Number(response.headers.get("retry-after")) * 1000;
    await sleep(Math.max(asked || 0, 20_000 * 2 ** attempt));
  }
}

async function json(url) {
  const response = await request(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function fromCommons(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search" +
    `&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}&gsrnamespace=6&gsrlimit=40` +
    `&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=${WIDTH}`;
  const pages = Object.values((await json(url)).query?.pages ?? {});
  return pages.flatMap((page) => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    if (!info || info.mime !== "image/jpeg" || info.width < 1600) return [];
    return [
      {
        from: "Wikimedia Commons",
        title: page.title,
        author: text(meta.Artist?.value) || "Unknown",
        license: text(meta.LicenseShortName?.value),
        licenseUrl: meta.LicenseUrl?.value ?? "",
        source: info.descriptionurl,
        image: info.thumburl,
        width: info.width,
        height: info.height,
        described: text(meta.ImageDescription?.value).slice(0, 240),
      },
    ];
  });
}

const CC = { by: "CC BY", "by-sa": "CC BY-SA", cc0: "CC0", pdm: "Public domain" };

async function fromOpenverse(query) {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    "&license=by,by-sa,cc0,pdm&page_size=20";
  const { results = [] } = await json(url);
  return results.flatMap((r) => {
    // Commons is asked directly, with better metadata.
    if (r.source === "wikimedia" || !r.url || (r.width ?? 0) < WIDTH) return [];
    return [
      {
        from: r.source,
        title: r.title ?? "",
        author: r.creator ?? "Unknown",
        license: `${CC[r.license] ?? r.license} ${r.license_version ?? ""}`.trim(),
        licenseUrl: r.license_url ?? "",
        source: r.foreign_landing_url,
        image: r.url,
        width: r.width,
        height: r.height,
        described: (r.tags ?? [])
          .map((t) => t.name)
          .slice(0, 12)
          .join(", "),
      },
    ];
  });
}

/** Numbered tiles, twelve to a sheet: one look takes in a dozen candidates. */
async function sheets(dir, count) {
  const [tileW, tileH, columns] = [400, 280, 4];
  for (let first = 0; first < count; first += 12) {
    const tiles = [];
    for (let i = first; i < Math.min(first + 12, count); i++) {
      const n = String(i + 1).padStart(2, "0");
      const label = Buffer.from(
        `<svg width="70" height="44"><rect width="70" height="44" fill="black"/>` +
          `<text x="35" y="33" font-size="30" font-family="Helvetica" font-weight="bold" fill="white" text-anchor="middle">${n}</text></svg>`,
      );
      const tile = await sharp(`${dir}/c${n}.jpg`)
        .resize(tileW, tileH, { fit: "cover" })
        .composite([{ input: label, top: 0, left: 0 }])
        .toBuffer();
      const at = i - first;
      tiles.push({
        input: tile,
        left: (at % columns) * tileW,
        top: Math.floor(at / columns) * tileH,
      });
    }
    await sharp({
      create: { width: tileW * columns, height: tileH * 3, channels: 3, background: "#222" },
    })
      .composite(tiles)
      .jpeg({ quality: 80 })
      .toFile(`${dir}/sheet-${first / 12 + 1}.jpg`);
  }
}

async function find(city, country, slug, extra) {
  const dir = `${STAGING}/${slug}`;
  await mkdir(dir, { recursive: true });
  // Extra arguments are searches of their own: the city's English or local name (« Cape Town »
  // for Le Cap), a neighbourhood, a landmark.
  const queries = [
    `"${city}" ${country}`,
    ...["night", "street", "market", "skyline", "beach", "people"].map(
      (word) => `"${city}" ${word}`,
    ),
    ...extra,
  ];
  const perQuery = [];
  for (const query of [`incategory:"${city}"`, ...queries]) {
    const sources = [fromCommons, ...(query === queries[0] ? [fromOpenverse] : [])];
    for (const source of sources) {
      try {
        perQuery.push(await source(query));
      } catch (error) {
        console.error(`skipped: ${error.message}`);
      }
    }
  }
  // One from each search in turn, and at most three of a series (« Parade 01 », « Parade 02 »…):
  // a single event otherwise fills every slot and the city shows as one afternoon.
  const found = [];
  for (let i = 0; perQuery.some((list) => i < list.length); i++)
    for (const list of perQuery) if (list[i]) found.push(list[i]);
  const seen = new Set();
  const series = new Map();
  const kept = found.filter((c) => {
    const ratio = c.width / c.height;
    const stem = `${c.author}|${c.title
      .replace(/[\d()._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24)}`;
    const fits =
      FREE.test(c.license) &&
      ratio >= 1.2 &&
      ratio <= 2.6 &&
      !NOT_A_VIEW.test(c.title) &&
      !seen.has(c.source) &&
      (series.get(stem) ?? 0) < 3;
    if (fits) series.set(stem, (series.get(stem) ?? 0) + 1);
    seen.add(c.source);
    return fits;
  });
  const candidates = [];
  for (const candidate of kept.slice(0, MOST)) {
    const n = String(candidates.length + 1).padStart(2, "0");
    try {
      const response = await request(candidate.image);
      if (!response.ok) continue;
      await sharp(Buffer.from(await response.arrayBuffer()))
        .rotate()
        .resize({ width: WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 78, mozjpeg: true })
        .toFile(`${dir}/c${n}.jpg`);
      candidates.push({ n: Number(n), ...candidate });
    } catch {
      // A file that will not download or decode is simply not a candidate.
    }
  }
  await sheets(dir, candidates.length);
  await writeFile(
    `${dir}/candidates.json`,
    JSON.stringify({ city, country, slug, candidates }, null, 2),
  );
  console.log(`${city}: ${candidates.length} candidates in ${dir}`);
}

async function apply(slug) {
  const dir = `${STAGING}/${slug}`;
  const { city, candidates } = JSON.parse(await readFile(`${dir}/candidates.json`, "utf8"));
  /** picks.json: [{ "n": 7, "alt": "…", "shows": ["night", "people"] }] in display order. */
  const picks = JSON.parse(await readFile(`${dir}/picks.json`, "utf8"));
  const dataFile = "src/data/city-photos.json";
  const all = existsSync(dataFile) ? JSON.parse(await readFile(dataFile, "utf8")) : {};
  const photos = [];
  for (const [index, pick] of picks.entries()) {
    const candidate = candidates.find((c) => c.n === pick.n);
    if (!candidate) throw new Error(`${slug}: no candidate ${pick.n}`);
    if (!pick.alt?.trim()) throw new Error(`${slug}: candidate ${pick.n} has no alt text`);
    // -01 is left to the city's first photo (src/data/photos.json).
    const file = `${slug}-${String(index + 2).padStart(2, "0")}.jpg`;
    await sharp(`${dir}/c${String(pick.n).padStart(2, "0")}.jpg`).toFile(`public/photos/${file}`);
    photos.push({
      file,
      title: candidate.title,
      author: candidate.author,
      license: candidate.license,
      licenseUrl: candidate.licenseUrl,
      source: candidate.source,
      from: candidate.from,
      alt: pick.alt.trim(),
      shows: pick.shows ?? [],
    });
  }
  all[city] = photos;
  await writeFile(dataFile, `${JSON.stringify(all, null, 2)}\n`);
  console.log(`${city}: ${photos.length} photos written`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === "find" && rest.length >= 3) await find(rest[0], rest[1], rest[2], rest.slice(3));
else if (command === "apply" && rest.length === 1) await apply(rest[0]);
else {
  console.error('usage: find "<City>" "<Country>" <slug> [more searches…] | apply <slug>');
  process.exit(1);
}
