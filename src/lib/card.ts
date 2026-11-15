import type { City, CriterionKey } from "./cities";
import type { Match, Rated } from "./ranking";

/**
 * « Si tu y vivais »: three lines read straight from the sourced scores (0 to 5). A line no
 * source rates is left out rather than guessed.
 */
export function livingLines(city: City): Rated[] {
  const level = (keys: CriterionKey[]) => {
    const known = keys.map((key) => city.scores[key].level).filter((l): l is number => l !== null);
    return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
  };
  const lines: [string, number | null][] = [
    ["Vivre avec un revenu européen", level(["cost"])],
    ["Allers-retours vers l'Europe", level(["flights"])],
    [
      "Confort : sécurité, soins, internet",
      level(["safety", "healthcare", "utilities", "internet"]),
    ],
  ];
  return lines
    .filter((line): line is [string, number] => line[1] !== null)
    .map(([label, l]) => ({ label, level: Math.max(1, l) }));
}

/** The other cities of the same country, best first: « Aussi au Sénégal : Saly 94 % ». */
export function sameCountry(ranked: Match[], city: City): { name: string; score: number }[] {
  return ranked
    .filter((m) => m.city.country === city.country && m.city.name !== city.name)
    .map((m) => ({ name: m.city.name, score: m.score }));
}

const REGIONS: Record<City["zone"], string> = {
  ouest: "Afrique de l'Ouest",
  centre: "Afrique centrale",
  est: "Afrique de l'Est",
  sud: "Afrique australe",
  nord: "Afrique du Nord",
};

export const regionName = (zone: City["zone"]) => REGIONS[zone];

/** The `cost` score in words: 5 is cheapest (architecture.md, `cost`). */
const COSTS = [
  "Coût de vie très élevé",
  "Coût de vie très élevé",
  "Coût de vie élevé",
  "Coût de vie intermédiaire",
  "Coût de vie abordable",
  "Coût de vie très abordable",
];

export const costLabel = (level: number | null) => (level === null ? undefined : COSTS[level]);
