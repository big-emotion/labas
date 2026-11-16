import { CRITERIA, type City, type CriterionDefinition } from "./cities";

/**
 * The preview of « La ville, critère par critère » on a city page grouped by theme (beta
 * feedback, 2026-11-16): its three strongest criteria and its weakest, before « Voir les 16
 * critères ». Only criteria where a higher level is better: for a « target » criterion such as
 * the pace of the city, a high level is neither a strength nor a weakness.
 */
export function criteriaPreview(city: City): {
  strongest: CriterionDefinition[];
  weakest: CriterionDefinition | undefined;
} {
  const rated = CRITERIA.filter(
    (c) => c.direction === "higher-is-better" && city.scores[c.key].level !== null,
  ).sort((a, b) => city.scores[b.key].level! - city.scores[a.key].level!);
  const strongest = rated.slice(0, 3);
  const last = rated.at(-1);
  return { strongest, weakest: last && !strongest.includes(last) ? last : undefined };
}
