import { tapEvent, type TapPlace } from "./analytics";
import { browserStore, track } from "./keep-dom";
import { isTapKind, TAP_KINDS, tapOn, type TapCounts, type TapKind, type TapsByCity } from "./taps";
import { INTL_LOCALE, type Bilingual, type Locale } from "../i18n/locale";

/**
 * The one-tap reaction row (operator, 2026-11-20). Any `[data-taps="<city slug>"]` element
 * becomes three buttons with their public counts. The reader's own answer lives in their
 * browser; the server keeps counts only (server/accounts.ts), so a tap works without an account.
 */
const STORE_KEY = "labas:taps";

const COPY: Bilingual<{
  labels: Record<TapKind, string>;
  group: string;
  noted: string;
}> = {
  fr: {
    labels: { like: "J'aime", suits: "Ça me correspond", not: "Ça ne me correspond pas" },
    group: "Votre réaction à cette ville",
    noted: "Noté. Le bouton « Pas pour moi », plus bas, l'écarte de votre liste.",
  },
  en: {
    labels: { like: "I like it", suits: "It suits me", not: "It doesn't suit me" },
    group: "Your reaction to this city",
    noted: 'Noted. The "Not for me" button, further down, leaves it out of your list.',
  },
};

let loaded: Promise<TapsByCity> | undefined;
const counts: TapsByCity = {};

/** Every city's counts, asked once per page; empty when the service is not there. */
export function loadTaps(): Promise<TapsByCity> {
  loaded ??= fetch("/api/compte/taps")
    .then((response) => (response.ok ? response.json() : { taps: {} }))
    .then((body: { taps?: TapsByCity }) => Object.assign(counts, body.taps ?? {}))
    .catch(() => counts);
  return loaded;
}

/** The counts already loaded for a city; nothing before loadTaps() has answered. */
export const loadedTaps = (slug: string): TapCounts | undefined => counts[slug];

function mine(): Record<string, TapKind> {
  try {
    const kept = JSON.parse(browserStore()?.getItem(STORE_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(kept).filter(([, kind]) => isTapKind(kind))) as Record<
      string,
      TapKind
    >;
  } catch {
    return {};
  }
}

function keep(slug: string, kind: TapKind | null) {
  const all = mine();
  if (kind) all[slug] = kind;
  else delete all[slug];
  try {
    browserStore()?.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    // A full or blocked storage only forgets the pressed state on the next visit.
  }
}

function draw(row: HTMLElement, locale: Locale) {
  const slug = row.dataset.taps!;
  const own = mine()[slug];
  const number = new Intl.NumberFormat(INTL_LOCALE[locale]);
  for (const button of row.querySelectorAll<HTMLButtonElement>("[data-tap]")) {
    const kind = button.dataset.tap as TapKind;
    button.setAttribute("aria-pressed", String(kind === own));
    const count = counts[slug]?.[kind] ?? 0;
    const shown = button.querySelector("b")!;
    // A city nobody reacted to shows no « 0 » (operator, 2026-11-20).
    shown.hidden = count === 0;
    shown.textContent = number.format(count);
  }
}

/** Draws every row of this city again: the same city can stand on a card and in a list. */
function drawAll(slug: string, locale: Locale) {
  for (const row of document.querySelectorAll<HTMLElement>(`[data-taps="${slug}"]`))
    if (row.dataset.wired) draw(row, locale);
}

async function send(slug: string, kind: TapKind | null, was: TapKind | null, locale: Locale) {
  try {
    const response = await fetch("/api/compte/taps", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ city: slug, kind, was }),
    });
    if (!response.ok) return;
    counts[slug] = ((await response.json()) as { taps: TapCounts }).taps;
    drawAll(slug, locale);
  } catch {
    // Offline or no service: the reader's own answer stays, the public count waits.
  }
}

/** Turns the `[data-taps]` elements under `root` into reaction rows; safe to call again. */
export function wireTaps(root: ParentNode, locale: Locale, place: TapPlace): void {
  const copy = COPY[locale];
  for (const row of root.querySelectorAll<HTMLElement>("[data-taps]")) {
    if (row.dataset.wired || !row.dataset.taps) continue;
    row.dataset.wired = "true";
    row.classList.add("taps");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", copy.group);
    const note = document.createElement("p");
    note.className = "taps-note";
    note.setAttribute("role", "status");
    row.replaceChildren(
      ...TAP_KINDS.map((kind) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.tap = kind;
        button.append(copy.labels[kind], " ", document.createElement("b"));
        return button;
      }),
      note,
    );
    row.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tap]");
      if (!button) return;
      const slug = row.dataset.taps!;
      const tap = tapOn(button.dataset.tap as TapKind, mine()[slug], counts[slug]);
      counts[slug] = tap.counts;
      keep(slug, tap.kind);
      drawAll(slug, locale);
      // Only where « Pas pour moi » is offered beside it (the quick quiz's cards).
      const setAside = row.parentElement?.querySelector<HTMLElement>(".not-for-me:not([hidden])");
      note.textContent = tap.kind === "not" && setAside ? copy.noted : "";
      track(tapEvent(place, slug, tap.kind));
      void send(slug, tap.kind, tap.was, locale);
    });
    draw(row, locale);
  }
  void loadTaps().then(() => {
    for (const row of root.querySelectorAll<HTMLElement>("[data-taps][data-wired]"))
      draw(row, locale);
  });
}
