import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import sharp from "sharp";
import borders from "../data/africa-borders.json";
import { CITIES, type City } from "./cities";
import { MAP_HEIGHT, MAP_WIDTH, project } from "./map";
import { photoFor } from "./photos";

/**
 * The pictures social networks show when a Là-bas link is shared, drawn at build time so no
 * page calls a third party. Colours repeat src/styles/global.css: satori cannot read CSS variables.
 */
const NIGHT = "#161a5c";
const NIGHT_DEEP = "#0e1145";
const NIGHT_LIFT = "#262c86";
const THREAD = "#f1f0ff";
const THREAD_DIM = "#b4b8ea";
const SAFFRON = "#ffb627";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** Satori reads woff, not woff2 or variable fonts, hence the static fontsource packages. */
const require = createRequire(import.meta.url);
const font = (file: string) => readFileSync(require.resolve(`@fontsource/${file}`));
const FONTS = [
  {
    name: "Fraunces",
    data: font("fraunces/files/fraunces-latin-900-normal.woff"),
    weight: 900,
    style: "normal",
  },
  {
    name: "Fraunces",
    data: font("fraunces/files/fraunces-latin-400-italic.woff"),
    weight: 400,
    style: "italic",
  },
  {
    name: "Nunito Sans",
    data: font("nunito-sans/files/nunito-sans-latin-400-normal.woff"),
    weight: 400,
    style: "normal",
  },
  {
    name: "Nunito Sans",
    data: font("nunito-sans/files/nunito-sans-latin-700-normal.woff"),
    weight: 700,
    style: "normal",
  },
] as const;

/** The grave accent of « là » in the logo: Africa, traced from real coordinates (Wordmark.astro). */
const AFRICA =
  "M19.7 4.0 L26.2 4.7 L31.6 2.7 L41.1 2.0 L42.2 4.8 L41.0 6.7 L47.5 8.5 L53.5 11.2 L54.3 8.9 L60.9 9.6 L67.4 10.1 L70.6 10.0 L71.0 11.9 L72.6 15.4 L75.0 19.8 L77.1 25.6 L79.9 30.9 L84.4 34.6 L85.2 36.2 L86.8 37.8 L95.7 36.0 L95.5 37.8 L93.5 43.7 L88.8 49.0 L84.3 52.3 L80.4 57.0 L79.9 60.7 L81.5 65.6 L81.8 71.6 L76.7 75.5 L73.9 78.0 L74.8 83.5 L71.0 86.1 L71.4 90.0 L68.8 91.5 L64.8 95.5 L61.7 96.8 L54.2 98.0 L52.1 97.2 L51.8 93.6 L49.5 89.7 L47.5 87.1 L46.9 82.2 L44.9 78.3 L43.3 74.6 L43.9 69.6 L45.1 63.4 L43.9 59.7 L43.3 58.1 L39.5 53.0 L40.2 51.1 L40.5 46.3 L38.9 45.7 L35.6 45.9 L32.1 43.1 L29.2 43.5 L24.9 45.3 L22.2 44.6 L17.6 45.8 L13.2 43.3 L10.0 40.3 L7.6 37.2 L5.3 34.2 L4.3 32.1 L5.6 30.4 L6.3 26.4 L4.9 23.7 L7.6 19.7 L10.3 14.8 L14.8 11.2 L17.4 6.9 L18.5 6.4 Z";

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: {
    style: { display: "flex", ...style },
    children: children.length === 1 ? children[0] : children,
  },
});
const svgImage = (svg: string, width: number, height: number): Node => ({
  type: "img",
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height },
});

/** The site's map: every city a light, the one shared (if any) larger and ringed. */
function mapSvg(highlight?: City): string {
  const land = borders.map((country) => `<path d="${country.d}"/>`).join("");
  const dots = CITIES.map((city) => {
    const { x, y } = project(city.lat, city.lon);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>`;
  }).join("");
  const mark = highlight
    ? (() => {
        const { x, y } = project(highlight.lat, highlight.lon);
        return `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${SAFFRON}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="5.5" fill="${SAFFRON}"/>`;
      })()
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}"><g fill="${NIGHT_LIFT}" stroke="${NIGHT_DEEP}" stroke-width="0.7" stroke-linejoin="round">${land}</g><g fill="${SAFFRON}" opacity="${highlight ? 0.35 : 0.95}">${dots}</g>${mark}</svg>`;
}

/** « Là-bas » with Africa as the accent, as in the site's header. */
function wordmark(size: number, ink: string): Node {
  const accent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="${SAFFRON}" transform="rotate(-18 50 50)" d="${AFRICA}"/></svg>`;
  return h(
    "div",
    {
      fontFamily: "Fraunces",
      fontWeight: 900,
      fontSize: size,
      color: ink,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      alignItems: "flex-end",
    },
    "l",
    h(
      "div",
      { position: "relative" },
      "a",
      h(
        "div",
        { position: "absolute", left: size * 0.1, top: -size * 0.32 },
        svgImage(accent, size * 0.5, size * 0.5),
      ),
    ),
    h("span", { color: SAFFRON }, "-"),
    "bas",
  );
}

/** Satori lays boxes out without border-box, so margins are a fixed frame, not padding. */
const PAD_X = 72;
const PAD_Y = 60;
const frame = (style: Record<string, unknown>, ...children: unknown[]) =>
  h(
    "div",
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      background: NIGHT,
      fontFamily: "Nunito Sans",
      position: "relative",
    },
    ...children.slice(0, -1),
    h(
      "div",
      {
        position: "absolute",
        left: PAD_X,
        top: PAD_Y,
        width: CARD_WIDTH - 2 * PAD_X,
        height: CARD_HEIGHT - 2 * PAD_Y,
        ...style,
      },
      children[children.length - 1],
    ),
  );

/** The largest size, up to 120px, at which the name fits the width (Fraunces 900 runs about 0.64em a letter). */
const nameSize = (name: string, width: number) =>
  Math.min(120, Math.floor(width / (name.length * 0.64)));

function homeCard(): Node {
  return frame(
    { justifyContent: "space-between" },
    h(
      "div",
      {
        justifyContent: "space-between",
        width: CARD_WIDTH - 2 * PAD_X,
        height: CARD_HEIGHT - 2 * PAD_Y,
      },
      h(
        "div",
        { flexDirection: "column", justifyContent: "space-between", width: 640 },
        wordmark(56, THREAD),
        h(
          "div",
          { flexDirection: "column" },
          h(
            "div",
            {
              flexDirection: "column",
              fontFamily: "Fraunces",
              fontSize: 76,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: THREAD,
            },
            h("span", { fontWeight: 900 }, "Quelle ville d’Afrique"),
            h("span", { fontStyle: "italic", fontWeight: 400, color: SAFFRON }, "vous ressemble ?"),
          ),
          h(
            "div",
            { marginTop: 28, fontSize: 28, color: THREAD_DIM },
            `${CITIES.length} villes dans les 54 pays d’Afrique. Sans inscription.`,
          ),
        ),
      ),
      h("div", { alignItems: "center" }, svgImage(mapSvg(), 400, 422)),
    ),
  );
}

function cityCard(city: City): Node {
  const photo = photoFor(city.name);
  const text = h(
    "div",
    { flexDirection: "column" },
    h("div", { fontSize: 30, color: THREAD_DIM, fontWeight: 700 }, "Vivre à"),
    h(
      "div",
      {
        fontFamily: "Fraunces",
        fontWeight: 900,
        fontSize: nameSize(city.name, photo ? 680 : 600),
        lineHeight: 1,
        letterSpacing: "-0.02em",
        color: THREAD,
      },
      city.name,
    ),
    h("div", { marginTop: 14, fontSize: 32, color: SAFFRON, fontWeight: 700 }, city.country),
  );
  if (!photo) {
    return frame(
      { justifyContent: "space-between" },
      h(
        "div",
        {
          justifyContent: "space-between",
          width: CARD_WIDTH - 2 * PAD_X,
          height: CARD_HEIGHT - 2 * PAD_Y,
        },
        h(
          "div",
          { flexDirection: "column", justifyContent: "space-between", width: 620 },
          wordmark(48, THREAD),
          text,
        ),
        h("div", { alignItems: "center" }, svgImage(mapSvg(city), 400, 422)),
      ),
    );
  }
  const image = readFileSync(join(process.cwd(), "public", "photos", photo.file)).toString(
    "base64",
  );
  return frame(
    { flexDirection: "column", justifyContent: "space-between" },
    {
      type: "img",
      props: {
        src: `data:image/jpeg;base64,${image}`,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        style: { position: "absolute", objectFit: "cover" },
      },
    },
    // A night veil from the bottom keeps the name readable on any photo.
    h("div", {
      position: "absolute",
      left: 0,
      top: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundImage: `linear-gradient(180deg, rgba(22,26,92,0.45) 0%, rgba(22,26,92,0.2) 28%, rgba(14,17,69,0.78) 55%, rgba(14,17,69,0.95) 100%)`,
    }),
    h(
      "div",
      {
        flexDirection: "column",
        justifyContent: "space-between",
        width: CARD_WIDTH - 2 * PAD_X,
        height: CARD_HEIGHT - 2 * PAD_Y,
      },
      wordmark(48, THREAD),
      h(
        "div",
        { justifyContent: "space-between", alignItems: "flex-end" },
        text,
        h(
          "div",
          {
            fontSize: 16,
            color: THREAD_DIM,
            width: 300,
            justifyContent: "flex-end",
            textAlign: "right",
          },
          `Photo : ${photo.author} · ${photo.license}`,
        ),
      ),
    ),
  );
}

async function toPng(node: Node, width: number, height: number): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(node as never, { width, height, fonts: FONTS as never });
  return new Uint8Array(
    new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng(),
  );
}

export type ShareCard = { kind: "home" } | { kind: "city"; city: City };

/** JPEG, not PNG: a photo card weighs about 1 MB as PNG and under 200 KB as JPEG. */
export async function renderShareCard(card: ShareCard): Promise<Uint8Array<ArrayBuffer>> {
  const png = await toPng(
    card.kind === "home" ? homeCard() : cityCard(card.city),
    CARD_WIDTH,
    CARD_HEIGHT,
  );
  return new Uint8Array(await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
}

/** The app icon (public/favicon.svg) on a full square: home screens round the corners themselves. */
export function renderIcon(size: number): Promise<Uint8Array<ArrayBuffer>> {
  const favicon = readFileSync(join(process.cwd(), "public", "favicon.svg"), "utf8").replace(
    'rx="22"',
    'rx="0"',
  );
  return Promise.resolve(
    new Uint8Array(new Resvg(favicon, { fitTo: { mode: "width", value: size } }).render().asPng()),
  );
}
