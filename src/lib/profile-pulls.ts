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
  wants?: ("beach" | "wild" | "nature" | "party" | "history" | "culture")[];
  offTrack?: "far" | "some" | "near";
  afterWork?: "rooftops" | "outdoors" | "home";
  friends?: "associations" | "diaspora" | "neighbours";
  mustWork?: ("utilities" | "internet" | "paperwork" | "care")[];
  ambition?: "business" | "career" | "network";
  evenings?: "residential" | "space" | "nature";
  music?: string[];
}

// Music pulls by country, below, not by choice.
const EFFECTS: { [K in Exclude<keyof ProfileAnswers, "music">]-?: Record<string, Effect> } = {
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
    utilities: { pulls: [pull("comfort", 0.9, 2.5)] },
    internet: { pulls: [pull("internet", 0.9, 2.5)] },
    paperwork: { pulls: [pull("paperwork", 0.9, 2)] },
    // Healthcare is half of the « comfort » axis, with utilities.
    care: { pulls: [pull("comfort", 0.9, 2)] },
  },
  ambition: {
    business: { pulls: [pull("business", 0.95, 3)] },
    career: { pulls: [pull("jobs", 0.95, 3)] },
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
      pulls.push(...(effect?.pulls ?? []));
      facts.push(...(effect?.facts ?? []));
    }
  }
  // A small pull: the music one loves is a reason, never the reason.
  const countries = musicCountries(answers.music);
  if (countries.length) facts.push({ kind: "music", values: countries, weight: 1.5 });
  return { pulls, facts };
}
