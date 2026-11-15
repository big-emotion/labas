import catalogue from "../data/city-actions.json";
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

/**
 * The « Y aller » links of a city: flights, lodging, then the local links. None for a city
 * travel advice warns against (operator, 2026-11-15). Neutral links, no affiliation: Google
 * Flights fills the departure from where the reader is, which a fixed origin could not.
 */
export function goingThere(city: City): GoingLink[] | undefined {
  const actions = BY_NAME.get(city.name);
  if (city.advisedAgainst || !actions) return undefined;
  const place = `${city.name}, ${city.country}`;
  return [
    {
      title: `Vols vers ${city.name} (Google Flights)`,
      url: `https://www.google.com/travel/flights?hl=fr&q=${encodeURIComponent(`Vols vers ${actions.airport}`)}`,
    },
    {
      title: `Logement à ${city.name} (Booking)`,
      url: `https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(place)}`,
    },
    ...actions.links,
  ];
}
