import type { City } from "./cities";

const FRANCE = {
  orange: "la classe en orange : il la déconseille sauf raison impérative",
  red: "la classe en rouge : il la déconseille formellement",
} as const;
const UK = {
  all: "Le Royaume-Uni déconseille tout voyage.",
  "all-but-essential": "Le Royaume-Uni déconseille tout voyage sauf nécessité.",
} as const;

/** What travel advice is, said wherever it is shown. */
export const ADVICE_FRAMING =
  "Ces avis sont écrits pour des voyageurs qui ne connaissent pas la ville. Sur place, la situation change d'un quartier à l'autre : demande à des gens qui y vivent quelles précautions prendre.";

function frenchDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * What the authorities say about a city they advise against, as information for the reader.
 * The advice never removes a city (operator, 2026-11-15): it is written for visitors who have
 * never been, while people live, work and come back there; so the note says what it is and
 * sends the reader to people who live there.
 */
export function advisoryNote(city: City): string | undefined {
  if (!city.advisedAgainst) return undefined;
  const { franceDiplomatie, fcdo, date } = city.facts.advisory;
  const parts: string[] = [];
  if (franceDiplomatie === "orange" || franceDiplomatie === "red") {
    const when = date ? ` (avis du ${frenchDate(date)})` : "";
    parts.push(`Le ministère des Affaires étrangères ${FRANCE[franceDiplomatie]}${when}.`);
  }
  if (fcdo === "all" || fcdo === "all-but-essential") parts.push(UK[fcdo]);
  parts.push(ADVICE_FRAMING);
  return parts.join(" ");
}
