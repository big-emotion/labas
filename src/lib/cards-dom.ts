import { advisoryNote } from "./advisory";
import { reactionEvent } from "./analytics";
import { track } from "./keep-dom";
import { costLabel, livingLines, regionName, sameCountry } from "./card";
import { goingThere } from "./going";
import { linesFor } from "./lines";
import { photoFor } from "./photos";
import { UNEXPECTED_LABEL, type TemperamentLine } from "./city-temperament";
import type { Match, Rated } from "./ranking";

/** Render code for components/ResultCards.astro: a card for the top cities, a row for the rest. */

export const percent = (score: number) => `${Math.round(score * 100)}\u202f%`;

export function clone(id: string): HTMLElement {
  const template = document.getElementById(id) as HTMLTemplateElement;
  return template.content.firstElementChild!.cloneNode(true) as HTMLElement;
}

export function setText(root: HTMLElement, selector: string, text: string) {
  (root.querySelector(selector) as HTMLElement).textContent = text;
}

export function fillList(list: HTMLElement, items: string[]) {
  list.replaceChildren(
    ...items.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
}

function fillPortrait(box: HTMLElement, m: Match) {
  setText(box, ".portrait-title", `Pourquoi vous et ${m.city.name}`);
  (box.querySelector(".portrait") as HTMLElement).replaceChildren(
    ...m.portrait.map((line) => {
      const item = document.createElement("li");
      const said = document.createElement("span");
      said.className = "said";
      said.textContent = `Vous avez dit · ${line.said}`;
      item.append(said, document.createTextNode(line.text));
      return item;
    }),
  );
}

// The same fields for every city, whether it is in the top three or further down.
export function detailFor(m: Match, withPortrait: boolean): HTMLElement {
  const body = clone("detail-template");
  const lines = linesFor(m.city.name);
  const show = (field: string, visible: boolean) => {
    (body.querySelector(`[data-field="${field}"]`) as HTMLElement).hidden = !visible;
  };
  show("portrait", withPortrait && m.portrait.length > 0);
  if (withPortrait) fillPortrait(body.querySelector('[data-field="portrait"]')!, m);
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
  setText(body, '[data-field="watch"] p', m.city.watch);
  const advice = advisoryNote(m.city);
  show("advisory", Boolean(advice));
  setText(body, '[data-field="advisory"] p', advice ?? "");
  (body.querySelector('[data-field="full"]') as HTMLAnchorElement).href = `/ville/${m.city.slug}`;
  const reactions = body.querySelector('[data-field="reactions"]') as HTMLAnchorElement;
  reactions.href = `/ville/${m.city.slug}/#reactions`;
  reactions.textContent = `Voir les réactions sur ${m.city.name}`;
  // Rows are the only callers that show the portrait: it tells a list row from a top-3 card.
  reactions.addEventListener("click", () =>
    track(reactionEvent("Réactions consultées", withPortrait ? "row" : "card", m.city.slug)),
  );
  return body;
}

function setBar(root: HTMLElement, score: number) {
  (root.querySelector(".bar > span") as HTMLElement).style.width = `${Math.round(score * 100)}%`;
}

function fillRated(block: HTMLElement, lines: Rated[]) {
  block.hidden = lines.length === 0;
  block.querySelector("ul")!.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = line.label;
      item.append(label, pipsOf(line.level));
      return item;
    }),
  );
}

/** Five pips, `level` of them lit, read aloud as « 3 sur 5 ». */
function pipsOf(level: number): HTMLElement {
  const pips = document.createElement("span");
  pips.className = "pips";
  pips.setAttribute("aria-label", `${level} sur 5`);
  for (let i = 1; i <= 5; i++) {
    const pip = document.createElement("i");
    if (i <= level) pip.className = "on";
    pips.append(pip);
  }
  return pips;
}

// Every card has the same fields; only the first one shows its photo.
export function cardFor(m: Match, index: number, ranked: Match[]): HTMLElement {
  const card = clone("card-template");
  if (index === 0) card.classList.add("first");
  setText(card, ".rank", String(index + 1));
  setText(card, ".card-name", m.city.name);
  setText(card, ".card-country", `${m.city.country} · ${regionName(m.city.zone)}`);
  setText(card, ".fit b", percent(m.score));
  const split = card.querySelector(".split") as HTMLElement;
  fillLines(card.querySelector(".why-temper") as HTMLElement, m.temperamentLines);
  split.hidden = m.temperament === null;
  if (m.temperament !== null)
    split.innerHTML = `Tempérament <b>${percent(m.temperament)}</b> · Vie pratique <b>${percent(m.practical)}</b>`;
  setText(card, ".card-pitch", m.city.pitch);
  const photo = photoFor(m.city.name);
  if (index === 0 && photo) {
    const figure = card.querySelector(".photo") as HTMLElement;
    const image = figure.querySelector("img") as HTMLImageElement;
    image.src = `/photos/${photo.file}`;
    image.alt = photo.alt;
    setText(figure, "figcaption", `Photo : ${photo.author}, ${photo.license}, Wikimedia Commons`);
    figure.hidden = false;
  }
  fillRated(card.querySelector('[data-block="why"]')!, m.reasons);
  fillRated(card.querySelector('[data-block="against"]')!, m.drawbacks);
  fillRated(card.querySelector('[data-block="living"]')!, livingLines(m.city));
  const facts = [m.city.languageLabel, m.city.currency, costLabel(m.city.scores.cost.level)];
  fillList(
    card.querySelector(".facts") as HTMLElement,
    facts.filter((f): f is string => Boolean(f)),
  );
  const others = sameCountry(ranked, m.city);
  setText(
    card,
    ".same",
    others.length
      ? `Aussi dans le pays : ${others.map((o) => `${o.name} ${percent(o.score)}`).join(", ")}`
      : "",
  );
  if (goingThere(m.city)) {
    const go = card.querySelector(".go") as HTMLAnchorElement;
    go.href = `/ville/${m.city.slug}/#y-aller`;
    go.hidden = false;
  }
  card.querySelector(".detail")!.append(detailFor(m, false));
  return card;
}

export function rowFor(m: Match, position: number): HTMLElement {
  const row = clone("row-template");
  setText(row, ".rank", String(position));
  setText(row, ".row-name b", m.city.name);
  setText(row, ".row-country", `· ${m.city.country}`);
  setText(row, ".fit", percent(m.score));
  setText(row, ".row-tagline", m.city.tagline);
  setBar(row, m.score);
  row.querySelector(".detail")!.append(detailFor(m, true));
  return row;
}

/** The neighbourhood lines under a city; those that count nothing are marked against it. */
export function fillLines(list: HTMLElement, lines: TemperamentLine[]) {
  list.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      if (line.gauge) {
        // « Prévoir des imprévus » is drawn as a gauge, like the criteria (operator, 2026-11-16).
        item.className = "gauge-line";
        item.append(`${UNEXPECTED_LABEL} `, pipsOf(line.gauge.level));
        if (line.gauge.estimate) {
          const estimate = document.createElement("small");
          estimate.textContent = " estimation";
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
