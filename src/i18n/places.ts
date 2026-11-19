import { ZONES, type Zone } from "../lib/cities";
import type { Locale } from "./locale";

/**
 * English names of the places the data names in French. Only the names that differ are listed:
 * Dakar is Dakar in both languages. Data keys stay French (they join the data files), so these
 * names are for display only.
 */
const COUNTRIES_EN: Record<string, string> = {
  Sénégal: "Senegal",
  Bénin: "Benin",
  "RD Congo": "DR Congo",
  Cameroun: "Cameroon",
  Éthiopie: "Ethiopia",
  Tanzanie: "Tanzania",
  Ouganda: "Uganda",
  "Afrique du Sud": "South Africa",
  Maurice: "Mauritius",
  Égypte: "Egypt",
  Maroc: "Morocco",
  Algérie: "Algeria",
  Tunisie: "Tunisia",
  Guinée: "Guinea",
  "Guinée-Bissau": "Guinea-Bissau",
  Gambie: "The Gambia",
  "Cap-Vert": "Cabo Verde",
  Mauritanie: "Mauritania",
  Congo: "Republic of the Congo",
  "Guinée équatoriale": "Equatorial Guinea",
  "São Tomé-et-Príncipe": "São Tomé and Príncipe",
  Tchad: "Chad",
  Centrafrique: "Central African Republic",
  Érythrée: "Eritrea",
  Somalie: "Somalia",
  "Soudan du Sud": "South Sudan",
  Libye: "Libya",
  Soudan: "Sudan",
  Zambie: "Zambia",
  Namibie: "Namibia",
  Comores: "Comoros",
  "Somalie (Somaliland)": "Somalia (Somaliland)",
};

const CITIES_EN: Record<string, string> = {
  "Addis-Abeba": "Addis Ababa",
  "Le Cap": "Cape Town",
  "Le Caire": "Cairo",
  Alger: "Algiers",
  Mogadiscio: "Mogadishu",
  Alexandrie: "Alexandria",
  Assouan: "Aswan",
  Tanger: "Tangier",
  "Port-Soudan": "Port Sudan",
  Massaoua: "Massawa",
  Tadjourah: "Tadjoura",
};

const ZONES_EN: Record<Zone, string> = {
  ouest: "West Africa",
  centre: "Central Africa",
  est: "East Africa",
  sud: "Southern Africa and the Indian Ocean",
  nord: "North Africa",
};

/** A country as the reader's language names it; `country` is the French data key. */
export function countryName(country: string, locale: Locale): string {
  return locale === "en" ? (COUNTRIES_EN[country] ?? country) : country;
}

/** A city as the reader's language names it; `city` is the French data key. */
export function cityName(city: string, locale: Locale): string {
  return locale === "en" ? (CITIES_EN[city] ?? city) : city;
}

/** A region of Africa as the reader's language names it. */
export function zoneName(zone: Zone, locale: Locale): string {
  return locale === "en" ? ZONES_EN[zone] : ZONES[zone];
}
