import { CITIES, type City } from "./cities";
import { TRAITS, temperamentLinesFor, type TemperamentAnswers } from "./city-temperament";
import type { Answers, Match } from "./ranking";
import { archetypeOf, type Archetype } from "./temperament";

/**
 * A result shared by link (beta feedback, 2026-11-16): the reader's temperament and their three
 * cities, in the part of the address after « # », which browsers never send to a server. Only
 * the five temperament answers travel: never origin, family country, faith or a filter, so the
 * person who receives the link learns where the reader fits, not who they are.
 */
export interface SharedPayload {
  temperament: TemperamentAnswers;
  cities: { slug: string; percent: number }[];
}

export interface SharedResult {
  archetype: Archetype | undefined;
  cities: { city: City; percent: number; lines: string[] }[];
}

const SITE = "https://labas.africa";
const LEVELS = [0, 0.5, 1];
const ADVENTURES = ["familiar", "open", "seeking"];

function temperamentOf(answers: Answers): TemperamentAnswers {
  const kept: Record<string, unknown> = {};
  for (const trait of TRAITS) if (answers[trait] !== undefined) kept[trait] = answers[trait];
  return kept as TemperamentAnswers;
}

function encode(payload: SharedPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function resultLink(answers: Answers, matches: Match[]): string {
  const payload: SharedPayload = {
    temperament: temperamentOf(answers),
    cities: matches.map((m) => ({ slug: m.city.slug, percent: Math.round(m.score * 100) })),
  };
  return `${SITE}/resultat/#r=${encode(payload)}`;
}

/** The payload of « #r=… », or null when the link is broken or was edited into nonsense. */
export function readShared(hash: string): SharedPayload | null {
  const raw = /^#r=([A-Za-z0-9_-]+)$/.exec(hash)?.[1];
  if (!raw) return null;
  try {
    const binary = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    );
    const temperament: Record<string, unknown> = {};
    for (const trait of TRAITS) {
      const value = payload?.temperament?.[trait];
      if (value === undefined) continue;
      const valid = trait === "adventure" ? ADVENTURES.includes(value) : LEVELS.includes(value);
      if (!valid) return null;
      temperament[trait] = value;
    }
    const cities = payload?.cities;
    if (!Array.isArray(cities) || cities.length === 0 || cities.length > 5) return null;
    for (const c of cities)
      if (typeof c?.slug !== "string" || !(c.percent >= 0 && c.percent <= 100)) return null;
    return {
      temperament: temperament as TemperamentAnswers,
      cities: cities.map((c) => ({ slug: c.slug, percent: Math.round(c.percent) })),
    };
  } catch {
    return null;
  }
}

/** What the result page shows: the profile and, for each city, why it fits the temperament. */
export function sharedResult(payload: SharedPayload): SharedResult | null {
  const cities = payload.cities.map((c) => ({
    city: CITIES.find((city) => city.slug === c.slug),
    percent: c.percent,
  }));
  if (cities.some((c) => !c.city)) return null;
  return {
    archetype: archetypeOf(payload.temperament as Answers),
    cities: cities.map(({ city, percent }) => ({
      city: city!,
      percent,
      lines: temperamentLinesFor(city!.name, payload.temperament),
    })),
  };
}

/** The message that goes with the link: the profile, each city and its why, then the link. */
export function shareText(answers: Answers, matches: Match[]): string {
  const link = resultLink(answers, matches);
  const shared = sharedResult(readShared(new URL(link).hash)!)!;
  const profile = shared.archetype
    ? [`Mon profil sur Là-bas : ${shared.archetype.name}. ${shared.archetype.text}`, ""]
    : [];
  const cities = shared.cities.flatMap((c, i) => [
    `${i + 1}. ${c.city.name} (${c.city.country}) · ${c.percent}\u202f%`,
    ...c.lines.slice(0, 2).map((line) => `   ${line}`),
  ]);
  return [
    ...profile,
    "Mes villes d'Afrique :",
    ...cities,
    "",
    `Voir mon résultat : ${link}`,
    `Et vous, quelle ville d'Afrique vous ressemble ? ${SITE}/`,
  ].join("\n");
}
