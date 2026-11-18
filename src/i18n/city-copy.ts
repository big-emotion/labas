import type { City, CriterionDefinition } from "../lib/cities";
import citiesEn from "../data/en/cities.json";
import criteriaEn from "../data/en/criteria.json";
import type { Locale } from "./locale";
import { cityName, countryName } from "./places";

/**
 * The city fields a reader sees on a card, in their language. English overlays live in
 * src/data/en/ keyed by the French city name; a field not translated yet falls back to French,
 * which is the decided state for the long city guides (operator, 2026-11-18: interface first).
 */
type CityText = Pick<City, "tagline" | "pitch" | "watch" | "languageLabel" | "currency">;
const CITIES_EN = citiesEn as Record<string, Partial<CityText>>;

export interface CityCopy extends CityText {
  name: string;
  country: string;
}

export function cityCopy(city: City, locale: Locale): CityCopy {
  const french: CityCopy = {
    name: city.name,
    country: city.country,
    tagline: city.tagline,
    pitch: city.pitch,
    watch: city.watch,
    languageLabel: city.languageLabel,
    currency: city.currency,
  };
  if (locale === "fr") return french;
  return {
    ...french,
    ...CITIES_EN[city.name],
    name: cityName(city.name, locale),
    country: countryName(city.country, locale),
  };
}

/** A criterion's reader-facing texts (label, means, doesNotMean, rubric), English by key. */
type CriterionText = Pick<CriterionDefinition, "label" | "means" | "doesNotMean" | "rubric">;
const CRITERIA_EN = criteriaEn as Record<string, Partial<CriterionText>>;

export function criterionCopy(criterion: CriterionDefinition, locale: Locale): CriterionDefinition {
  return locale === "fr" ? criterion : { ...criterion, ...CRITERIA_EN[criterion.key] };
}
