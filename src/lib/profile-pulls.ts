import { SEASONS, type Season } from "./holiday";
import { musicCountries } from "./music";
import type { FactPull, Pull } from "./fit";
import type { Answers } from "./ranking";

/**
 * What each profile question's answer pulls (validated
 * 2026-11-15). Each choice leans on data every city already has: its criteria, its settings and
 * its neighbourhoods on the temperament axes, so every answer moves cities.
 */
type Effect = { pulls?: Pull[]; facts?: FactPull[] };

const pull = (axis: Pull["axis"], target: number, weight: number): Pull => ({
  axis,
  target,
  weight,
});
/** A practical need the reader states outright: it ranks, unlike a need read between the lines. */
const need = (axis: Pull["axis"], target: number, weight: number): Pull => ({
  ...pull(axis, target, weight),
  chosen: true,
});
const settings = (values: string[], weight: number): FactPull => ({
  kind: "settings",
  values,
  weight,
});
const aura = (
  trait: "saturday" | "adventure" | "together",
  value: number,
  weight: number,
): FactPull => ({ kind: "temperament", trait, value, weight });

export interface ProfileAnswers {
  nightOut?: "clubs" | "maquis" | "waterside";
  quietStay?: "beach" | "walks" | "history";
  duration?: "weekend" | "week" | "weeks" | "month";
  wants?: ("beach" | "wild" | "nature" | "party" | "history" | "culture" | "safari" | "sea")[];
  season?: Season;
  offTrack?: "far" | "some" | "near";
  afterWork?: "rooftops" | "outdoors" | "home";
  friends?: "associations" | "diaspora" | "neighbours";
  mustWork?: ("utilities" | "internet" | "paperwork" | "care")[];
  ambition?: "business" | "career" | "network";
  evenings?: "residential" | "space" | "nature";
  music?: string[];
}

// Music pulls by country, below, not by choice.
const EFFECTS: {
  [K in Exclude<keyof ProfileAnswers, "music" | "season">]-?: Record<string, Effect>;
} = {
  nightOut: {
    clubs: {
      pulls: [pull("nightlife", 1, 3), pull("pace", 0.85, 1)],
      facts: [aura("saturday", 1, 2)],
    },
    maquis: { pulls: [pull("nightlife", 0.8, 2), pull("culture", 0.7, 1)] },
    waterside: { pulls: [pull("nightlife", 0.55, 1)], facts: [settings(["water"], 2)] },
  },
  quietStay: {
    beach: { pulls: [pull("pace", 0.2, 1)], facts: [settings(["beach", "island"], 3)] },
    walks: { pulls: [pull("pace", 0.2, 1)], facts: [settings(["nature"], 3)] },
    history: { pulls: [pull("history", 0.9, 2.5), pull("pace", 0.3, 1)] },
  },
  // How long the holiday lasts: a short stay needs direct flights, a long one barely.
  duration: {
    weekend: { pulls: [pull("flights", 1, 3)] },
    week: { pulls: [pull("flights", 0.85, 2)] },
    weeks: { pulls: [pull("flights", 0.65, 1)] },
    month: {},
  },
  wants: {
    beach: { facts: [settings(["beach", "island"], 2.5)] },
    wild: { facts: [settings(["wildSpaces"], 2.5)] },
    nature: { facts: [settings(["nature"], 2.5)] },
    party: { pulls: [pull("nightlife", 0.95, 2)], facts: [aura("saturday", 1, 1)] },
    history: { pulls: [pull("history", 0.9, 2)] },
    culture: { pulls: [pull("culture", 0.9, 2)] },
    safari: { facts: [{ kind: "activities", tags: ["safari"], weight: 2.5 }] },
    sea: { facts: [{ kind: "activities", tags: ["diving", "surf", "watersports"], weight: 2 }] },
  },
  offTrack: {
    far: { pulls: [pull("returnees", 0.15, 2)], facts: [aura("adventure", 1, 2)] },
    some: { pulls: [pull("comfort", 0.7, 1)], facts: [aura("adventure", 0.5, 1)] },
    near: { pulls: [pull("comfort", 0.85, 1.5), pull("returnees", 0.8, 1.5)] },
  },
  afterWork: {
    rooftops: { pulls: [pull("nightlife", 0.8, 2), pull("pace", 0.75, 1)] },
    outdoors: { pulls: [pull("leisure", 0.85, 1.5)], facts: [settings(["water", "nature"], 1.5)] },
    home: { pulls: [pull("pace", 0.25, 1.5)], facts: [aura("saturday", 0, 1.5)] },
  },
  friends: {
    associations: { pulls: [pull("welcome", 0.9, 2)] },
    diaspora: { pulls: [pull("returnees", 0.9, 2)] },
    neighbours: { pulls: [pull("welcome", 0.75, 1)], facts: [aura("together", 1, 2)] },
  },
  mustWork: {
    utilities: { pulls: [need("comfort", 0.9, 2.5)] },
    internet: { pulls: [need("internet", 0.9, 2.5)] },
    paperwork: { pulls: [need("paperwork", 0.9, 2)] },
    // Healthcare is half of the « comfort » axis, with utilities.
    care: { pulls: [need("comfort", 0.9, 2)] },
  },
  ambition: {
    business: { pulls: [need("business", 0.95, 3)] },
    career: { pulls: [need("jobs", 0.95, 3)] },
    network: { pulls: [pull("pace", 0.8, 1.5), pull("returnees", 0.75, 1.5)] },
  },
  evenings: {
    residential: {
      facts: [aura("saturday", 0, 2.5), { kind: "upscale", values: [], weight: 1.5 }],
    },
    space: { pulls: [pull("pace", 0.2, 2)] },
    nature: { facts: [settings(["water", "nature"], 2)] },
  },
};

export function profileEffects(answers: Answers): { pulls: Pull[]; facts: FactPull[] } {
  const pulls: Pull[] = [];
  const facts: FactPull[] = [];
  for (const [question, byChoice] of Object.entries(EFFECTS)) {
    const given = answers[question as keyof ProfileAnswers];
    for (const choice of [given ?? []].flat()) {
      const effect = byChoice[choice as string];
      pulls.push(...(effect?.pulls ?? []).map((p) => ({ ...p, from: question })));
      facts.push(...(effect?.facts ?? []).map((f) => ({ ...f, from: question })));
    }
  }
  // The season counts like the length of the stay: a holiday in the rains is a poor holiday.
  const months = SEASONS.find((s) => s.value === answers.season)?.months;
  if (months) facts.push({ kind: "season", months: [...months], weight: 2, from: "season" });
  // The music's small weight as an answer is set in ranking.ts (ANSWER_WEIGHT).
  const countries = musicCountries(answers.music);
  if (countries.length)
    facts.push({ kind: "music", values: countries, weight: 1.5, from: "music" });
  return { pulls, facts };
}
