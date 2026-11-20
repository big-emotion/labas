import type { Answers, Match } from "./ranking";
import { whyTheseCities } from "./result-why";
import { cityCopy } from "../i18n/city-copy";
import type { Bilingual, Locale } from "../i18n/locale";
import { pathFor } from "../i18n/routes";

/** Render code for components/ResultWhy.astro. */

const COPY: Bilingual<{ first: (city: string) => string }> = {
  fr: { first: (city) => `Pourquoi ${city} en premier` },
  en: { first: (city) => `Why ${city} comes first` },
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

/** Fills « Pourquoi ces villes ? »; called after every drawing of the result. */
export function showWhy(matches: Match[], answers: Answers, locale: Locale): void {
  const box = document.querySelector<HTMLElement>("[data-why]");
  if (!box) return;
  const why = whyTheseCities(matches, answers, locale);
  firstCity = matches[0]?.city;
  box.hidden = !firstCity || (why.shared.length === 0 && why.first.length === 0);
  if (box.hidden || !firstCity) return;
  // With a single city on screen there is nothing to compare: its reasons go under its name.
  fillReasons(box.querySelector("[data-why-shared]")!, matches.length > 1 ? why.shared : []);
  fillReasons(box.querySelector("[data-why-first]")!, why.first);
  box.querySelector("[data-why-first-title]")!.textContent = COPY[locale].first(
    cityCopy(firstCity, locale).name,
  );
  fillReasons(box.querySelector("[data-why-yours]")!, why.yours?.said ?? []);
  const closer = box.querySelector<HTMLElement>("[data-why-closer]")!;
  closer.hidden = !why.yours?.closer;
  closer.textContent = why.yours?.closer ?? "";
  const know = box.querySelector<HTMLElement>("[data-why-know]")!;
  know.hidden = !why.toKnow;
  know.querySelector("span")!.textContent = why.toKnow ?? "";
}

let hook: HTMLElement | null = null;

/**
 * Puts the block of actions (components/KeepResults.astro) inside the first city's card, right
 * under its reaction row, once the cards are drawn: the first result is what hooks the reader, so
 * sharing, the e-mail, the review and the full questionnaire are offered there and nowhere else
 * (operator, 2026-11-20).
 */
export function placeHook(locale: Locale): void {
  if (!hook) {
    hook = document.querySelector<HTMLElement>("[data-hook]");
    hook
      ?.querySelector<HTMLButtonElement>("[data-hook-review]")
      ?.addEventListener("click", () => openReview(locale));
  }
  const reaction = document.querySelector("#cards > :first-child [data-taps]");
  if (hook && reaction) reaction.after(hook);
}
