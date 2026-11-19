import { verdictEvent, type VerdictPlace } from "./analytics";
import { track } from "./keep-dom";
import type { Match } from "./ranking";
import { whyTheseCities } from "./result-why";
import { cityCopy } from "../i18n/city-copy";
import type { Bilingual, Locale } from "../i18n/locale";
import { pathFor } from "../i18n/routes";

/** Render code for components/ResultWhy.astro. */

const COPY: Bilingual<{
  first: (city: string) => string;
  thanks: Record<"yes" | "no", string>;
}> = {
  fr: {
    first: (city) => `Pourquoi ${city} en premier`,
    thanks: {
      yes: "Merci ! Dites pourquoi en une phrase : votre avis aide les prochains lecteurs.",
      no: "Merci, c'est noté. Dites ce qui vous étonne : c'est ce qui nous aide le plus.",
    },
  },
  en: {
    first: (city) => `Why ${city} comes first`,
    thanks: {
      yes: "Thank you! Say why in one sentence: your review helps the next readers.",
      no: "Thank you, noted. Tell us what surprises you: that helps us most.",
    },
  },
};

function fillReasons(block: HTMLElement, labels: string[]) {
  block.hidden = labels.length === 0;
  block.querySelector("ul")!.replaceChildren(
    ...labels.map((label) => {
      const item = document.createElement("li");
      item.textContent = label;
      return item;
    }),
  );
}

let firstCity: Match["city"] | undefined;

/**
 * Opens the review form of the first city where it already sits on the page, under that city's
 * pitch; when the reviews did not load, the city page has the same form.
 */
function openReview(locale: Locale) {
  const preview = document.getElementById("reactions-preview");
  if (preview && !preview.hidden) {
    const open = preview.querySelector<HTMLButtonElement>("[data-open]");
    if (open?.getAttribute("aria-expanded") !== "true") open?.click();
    preview.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (firstCity) {
    window.location.href = `${pathFor("city", locale, firstCity.slug)}#reactions`;
  }
}

function wireVerdict(box: HTMLElement, locale: Locale) {
  const part = (name: string) => box.querySelector<HTMLElement>(`[data-verdict-${name}]`)!;
  for (const button of box.querySelectorAll<HTMLButtonElement>("[data-verdict]")) {
    button.addEventListener("click", () => {
      const verdict = button.dataset.verdict as "yes" | "no";
      track(verdictEvent(box.dataset.verdictBox as VerdictPlace, verdict === "yes"));
      part("ask").hidden = true;
      part("buttons").hidden = true;
      part("thanks").textContent = COPY[locale].thanks[verdict];
      part("thanks").hidden = false;
    });
  }
  box
    .querySelector<HTMLButtonElement>("[data-verdict-review]")
    ?.addEventListener("click", () => openReview(locale));
}

/** Fills « Pourquoi ces villes ? »; called after every drawing of the result. */
export function showWhy(matches: Match[], locale: Locale): void {
  const box = document.querySelector<HTMLElement>("[data-why]");
  if (!box) return;
  const why = whyTheseCities(matches);
  firstCity = matches[0]?.city;
  box.hidden = !firstCity || (why.shared.length === 0 && why.first.length === 0);
  if (box.hidden || !firstCity) return;
  // With a single city on screen there is nothing to compare: its reasons go under its name.
  fillReasons(box.querySelector("[data-why-shared]")!, matches.length > 1 ? why.shared : []);
  fillReasons(box.querySelector("[data-why-first]")!, why.first);
  box.querySelector("[data-why-first-title]")!.textContent = COPY[locale].first(
    cityCopy(firstCity, locale).name,
  );
  const know = box.querySelector<HTMLElement>("[data-why-know]")!;
  know.hidden = !why.toKnow;
  know.querySelector("span")!.textContent = why.toKnow ?? "";
}

let verdictBox: HTMLElement | null = null;

/**
 * Puts the verdict right under the first city, once the cards are drawn. Redrawing the cards
 * takes it out of the document, so the block is kept here, with the verdict the reader gave.
 */
export function placeVerdict(locale: Locale): void {
  if (!verdictBox) {
    verdictBox = document.querySelector<HTMLElement>("[data-verdict-box]");
    if (verdictBox) wireVerdict(verdictBox, locale);
  }
  const first = document.querySelector("#cards > :first-child");
  if (!verdictBox || !first) return;
  first.after(verdictBox);
  verdictBox.hidden = false;
}
