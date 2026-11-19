import { advisoryNote } from "./advisory";
import { reactionEvent } from "./analytics";
import { track } from "./keep-dom";
import { costLabel, livingLines, regionName, sameCountry } from "./card";
import { goingThere } from "./going";
import { linesFor } from "./lines";
import { photoFor } from "./photos";
import { cityName } from "../i18n/places";
import { gaugeWords, type TemperamentLine } from "./city-temperament";
import type { Match, Rated } from "./ranking";
import type { Bilingual, Locale } from "../i18n/locale";
import { pathFor } from "../i18n/routes";
import { cityCopy } from "../i18n/city-copy";

/** Render code for components/ResultCards.astro: a card for the top cities, a row for the rest. */

const COPY: Bilingual<{
  percent: (value: number) => string;
  portraitTitle: (city: string) => string;
  said: (answer: string) => string;
  reactions: (city: string) => string;
  pips: (level: number) => string;
  split: (temperament: string, practical: string) => string;
  photo: (author: string, license: string) => string;
  same: (others: string) => string;
}> = {
  fr: {
    // French puts a narrow no-break space before « % ».
    percent: (value) => `${value}\u202f%`,
    portraitTitle: (city) => `Pourquoi vous et ${city}`,
    said: (answer) => `Vous avez dit · ${answer}`,
    reactions: (city) => `Voir les réactions sur ${city}`,
    pips: (level) => `${level} sur 5`,
    split: (t, p) => `Tempérament <b>${t}</b> · Vie pratique <b>${p}</b>`,
    photo: (author, license) => `Photo : ${author}, ${license}, Wikimedia Commons`,
    same: (others) => `Aussi dans le pays : ${others}`,
  },
  en: {
    percent: (value) => `${value}%`,
    portraitTitle: (city) => `Why you and ${city}`,
    said: (answer) => `You said · ${answer}`,
    reactions: (city) => `See the reactions on ${city}`,
    pips: (level) => `${level} out of 5`,
    split: (t, p) => `Temperament <b>${t}</b> · Practical life <b>${p}</b>`,
    photo: (author, license) => `Photo: ${author}, ${license}, Wikimedia Commons`,
    same: (others) => `Also in the country: ${others}`,
  },
};

const percentIn = (score: number, locale: Locale) => COPY[locale].percent(Math.round(score * 100));

function clone(id: string): HTMLElement {
  const template = document.getElementById(id) as HTMLTemplateElement;
  return template.content.firstElementChild!.cloneNode(true) as HTMLElement;
}

function setText(root: HTMLElement, selector: string, text: string) {
  (root.querySelector(selector) as HTMLElement).textContent = text;
}

function fillList(list: HTMLElement, items: string[]) {
  list.replaceChildren(
    ...items.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
}

function fillPortrait(box: HTMLElement, m: Match, locale: Locale) {
  setText(box, ".portrait-title", COPY[locale].portraitTitle(cityCopy(m.city, locale).name));
  (box.querySelector(".portrait") as HTMLElement).replaceChildren(
    ...m.portrait.map((line) => {
      const item = document.createElement("li");
      const said = document.createElement("span");
      said.className = "said";
      said.textContent = COPY[locale].said(line.said);
      item.append(said, document.createTextNode(line.text));
      return item;
    }),
  );
}

// The same fields for every city, whether it is in the top three or further down.
function detailFor(m: Match, withPortrait: boolean, locale: Locale): HTMLElement {
  const city = cityCopy(m.city, locale);
  const body = clone("detail-template");
  const lines = linesFor(m.city.name);
  const show = (field: string, visible: boolean) => {
    (body.querySelector(`[data-field="${field}"]`) as HTMLElement).hidden = !visible;
  };
  show("portrait", withPortrait && m.portrait.length > 0);
  if (withPortrait) fillPortrait(body.querySelector('[data-field="portrait"]')!, m, locale);
  show("reputation", Boolean(lines?.reputation));
  setText(body, '[data-field="reputation"] p', lines?.reputation ?? "");
  show("surprise", Boolean(lines?.surprise));
  setText(body, '[data-field="surprise"] p', lines?.surprise ?? "");
  const places = lines?.neighbourhoods ?? [];
  show("neighbourhoods", places.length > 0);
  (body.querySelector(".places") as HTMLElement).replaceChildren(
    ...places.map((place) => {
      const item = document.createElement("li");
      const name = document.createElement("b");
      name.textContent = place.name;
      item.append(name, document.createTextNode(` ${place.text}`));
      return item;
    }),
  );
  // Cards already rate the reasons; rows show them here.
  show("reasons", withPortrait && m.reasons.length > 0);
  fillList(
    body.querySelector(".reasons") as HTMLElement,
    m.reasons.map((r) => r.label),
  );
  setText(body, '[data-field="watch"] p', city.watch);
  const advice = advisoryNote(m.city, locale);
  show("advisory", Boolean(advice));
  setText(body, '[data-field="advisory"] p', advice ?? "");
  const page = pathFor("city", locale, m.city.slug);
  (body.querySelector('[data-field="full"]') as HTMLAnchorElement).href = page;
  const reactions = body.querySelector('[data-field="reactions"]') as HTMLAnchorElement;
  reactions.href = `${page}#reactions`;
  reactions.textContent = COPY[locale].reactions(city.name);
  // Rows are the only callers that show the portrait: it tells a list row from a top-3 card.
  reactions.addEventListener("click", () =>
    track(reactionEvent("Réactions consultées", withPortrait ? "row" : "card", m.city.slug)),
  );
  return body;
}

function setBar(root: HTMLElement, score: number) {
  (root.querySelector(".bar > span") as HTMLElement).style.width = `${Math.round(score * 100)}%`;
}

function fillRated(block: HTMLElement, lines: Rated[], locale: Locale) {
  block.hidden = lines.length === 0;
  block.querySelector("ul")!.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = line.label;
      item.append(label, pipsOf(line.level, locale));
      return item;
    }),
  );
}

/** Five pips, `level` of them lit, read aloud as « 3 sur 5 ». */
function pipsOf(level: number, locale: Locale): HTMLElement {
  const pips = document.createElement("span");
  pips.className = "pips";
  pips.setAttribute("aria-label", COPY[locale].pips(level));
  for (let i = 1; i <= 5; i++) {
    const pip = document.createElement("i");
    if (i <= level) pip.className = "on";
    pips.append(pip);
  }
  return pips;
}

// Every card has the same fields; only the first one shows its photo.
export function cardFor(m: Match, index: number, ranked: Match[], locale: Locale): HTMLElement {
  const card = clone("card-template");
  const city = cityCopy(m.city, locale);
  const percent = (score: number) => percentIn(score, locale);
  if (index === 0) card.classList.add("first");
  setText(card, ".rank", String(index + 1));
  setText(card, ".card-name", city.name);
  setText(card, ".card-country", `${city.country} · ${regionName(m.city.zone, locale)}`);
  setText(card, ".fit b", percent(m.score));
  const split = card.querySelector(".split") as HTMLElement;
  fillLines(card.querySelector(".why-temper") as HTMLElement, m.temperamentLines, locale);
  split.hidden = m.temperament === null;
  if (m.temperament !== null)
    split.innerHTML = COPY[locale].split(percent(m.temperament), percent(m.practical));
  setText(card, ".card-pitch", city.pitch);
  const photo = photoFor(m.city.name);
  if (index === 0 && photo) {
    const figure = card.querySelector(".photo") as HTMLElement;
    const image = figure.querySelector("img") as HTMLImageElement;
    image.src = `/photos/${photo.file}`;
    image.alt = photo.alt;
    setText(figure, "figcaption", COPY[locale].photo(photo.author, photo.license));
    figure.hidden = false;
  }
  fillRated(card.querySelector('[data-block="why"]')!, m.reasons, locale);
  fillRated(card.querySelector('[data-block="against"]')!, m.drawbacks, locale);
  fillRated(card.querySelector('[data-block="living"]')!, livingLines(m.city, locale), locale);
  const facts = [city.languageLabel, city.currency, costLabel(m.city.scores.cost.level, locale)];
  fillList(
    card.querySelector(".facts") as HTMLElement,
    facts.filter((f): f is string => Boolean(f)),
  );
  const others = sameCountry(ranked, m.city);
  setText(
    card,
    ".same",
    others.length
      ? COPY[locale].same(
          others.map((o) => `${cityName(o.name, locale)} ${percent(o.score)}`).join(", "),
        )
      : "",
  );
  if (goingThere(m.city, locale)) {
    const go = card.querySelector(".go") as HTMLAnchorElement;
    go.href = `${pathFor("city", locale, m.city.slug)}#y-aller`;
    go.hidden = false;
  }
  card.querySelector(".detail")!.append(detailFor(m, false, locale));
  return card;
}

export function rowFor(m: Match, position: number, locale: Locale): HTMLElement {
  const row = clone("row-template");
  const city = cityCopy(m.city, locale);
  setText(row, ".rank", String(position));
  setText(row, ".row-name b", city.name);
  setText(row, ".row-country", `· ${city.country}`);
  setText(row, ".fit", percentIn(m.score, locale));
  setText(row, ".row-tagline", city.tagline);
  setBar(row, m.score);
  row.querySelector(".detail")!.append(detailFor(m, true, locale));
  return row;
}

/** The neighbourhood lines under a city; those that count nothing are marked against it. */
export function fillLines(list: HTMLElement, lines: TemperamentLine[], locale: Locale) {
  const gauge = gaugeWords(locale);
  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      if (line.gauge) {
        // « Prévoir des imprévus » is drawn as a gauge, like the criteria (operator, 2026-11-16).
        item.className = "gauge-line";
        item.append(`${gauge.label} `, pipsOf(line.gauge.level, locale));
        if (line.gauge.estimate) {
          const estimate = document.createElement("small");
          estimate.textContent = gauge.estimate;
          item.append(estimate);
        }
        return item;
      }
      item.textContent = line.text;
      if (line.weak) item.className = "weak";
      return item;
    }),
  );
}
