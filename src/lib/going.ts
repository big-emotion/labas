import catalogue from "../data/city-actions.json";
import type { Bilingual, Locale } from "../i18n/locale";
import { cityName, countryName } from "../i18n/places";
import type { City } from "./cities";

/** A link that moves the reader from a result to doing something about it. */
export interface GoingLink {
  title: string;
  url: string;
}

/**
 * Per city, the airport flights land at (IATA code, the nearest one with scheduled flights)
 * and one to three local links picked from the research: community groups, newcomer
 * associations, listing sites. Flights and lodging are computed, so only these are stored.
 */
interface CityActions {
  name: string;
  airport: string;
  links: GoingLink[];
}

const BY_NAME = new Map(
  (catalogue as unknown as CityActions[]).map((actions) => [actions.name, actions]),
);

const COPY: Bilingual<{
  flights: (city: string) => string;
  flightsQuery: (airport: string) => string;
  lodging: (city: string) => string;
  googleLanguage: string;
  bookingPage: string;
}> = {
  fr: {
    flights: (city) => `Vols vers ${city} (Google Flights)`,
    flightsQuery: (airport) => `Vols vers ${airport}`,
    lodging: (city) => `Logement à ${city} (Booking)`,
    googleLanguage: "fr",
    bookingPage: "searchresults.fr.html",
  },
  en: {
    flights: (city) => `Flights to ${city} (Google Flights)`,
    flightsQuery: (airport) => `Flights to ${airport}`,
    lodging: (city) => `Places to stay in ${city} (Booking)`,
    googleLanguage: "en-GB",
    bookingPage: "searchresults.en-gb.html",
  },
};

/**
 * The « Y aller » links of a city: flights, lodging, then the local links. None for a city
 * travel advice warns against (operator, 2026-11-15). Neutral links, no affiliation: Google
 * Flights fills the departure from where the reader is, which a fixed origin could not.
 * The local links are research data and stay as written. French by default while the result
 * cards that call it are being translated.
 */
export function goingThere(city: City, locale: Locale = "fr"): GoingLink[] | undefined {
  const actions = BY_NAME.get(city.name);
  if (city.advisedAgainst || !actions) return undefined;
  const copy = COPY[locale];
  const name = cityName(city.name, locale);
  // Booking's English page searches best with the English names.
  const place = `${name}, ${countryName(city.country, locale)}`;
  return [
    {
      title: copy.flights(name),
      url: `https://www.google.com/travel/flights?hl=${copy.googleLanguage}&q=${encodeURIComponent(copy.flightsQuery(actions.airport))}`,
    },
    {
      title: copy.lodging(name),
      url: `https://www.booking.com/${copy.bookingPage}?ss=${encodeURIComponent(place)}`,
    },
    ...actions.links,
  ];
}
