import { describe, expect, it } from "vitest";
import type { Profile, Reaction, TopCity } from "./reactions";
import { risingCities, searchReviews, type Place } from "./review-search";

const PLACES: Record<string, Place> = {
  dakar: { slug: "dakar", name: "Dakar", country: "Sénégal", zone: "ouest" },
  accra: { slug: "accra", name: "Accra", country: "Ghana", zone: "ouest" },
  nairobi: { slug: "nairobi", name: "Nairobi", country: "Kenya", zone: "est" },
  marrakech: { slug: "marrakech", name: "Marrakech", country: "Maroc", zone: "nord" },
};

/** A temperament as the quiz records it: the archetype and the five trait values. */
const profile = (name: string, values: number[]): Profile => ({
  name,
  traits: values.map((value, i) => ({ name: `t${i}`, range: "", value })),
});
const EXPLORER = profile("Exploration", [0.5, 1, 0, 0.5, 1]);
const REFUGE = profile("Refuge", [0, 0, 1, 1, 0]);
const NEAR_EXPLORER = profile("Conquête", [1, 0.5, 0, 0, 1]);

let day = 30;
function review(city: string, text: string, extra: Partial<Reaction> = {}): Reaction {
  day -= 1;
  return {
    id: `${city}-${day}`,
    city,
    name: "Awa",
    text,
    top: null,
    profile: null,
    createdAt: `2026-11-${String(day).padStart(2, "0")}T10:00:00.000Z`,
    mine: false,
    marks: {},
    myMarks: [],
    mention: null,
    replies: [],
    ...extra,
  };
}
const top = (...slugs: string[]): TopCity[] =>
  slugs.map((slug) => ({ slug, name: PLACES[slug].name, percent: 70 }));

const NO_FILTER = { query: "", city: null, zone: null, temperament: null };
const ids = (found: { review: Reaction }[]) => found.map((f) => f.review.id);

describe("searching the reviews", () => {
  const reviews = [
    review("dakar", "La mer change tout.", { profile: REFUGE }),
    review("nairobi", "Ville verte, embouteillages.", { profile: EXPLORER }),
    review("accra", "Très animé le soir."),
    review("marrakech", "Trop de touristes l'été.", { profile: NEAR_EXPLORER }),
  ];

  it("shows every review, newest first, when nothing is chosen", () => {
    const found = searchReviews(reviews, PLACES, NO_FILTER);
    expect(ids(found)).toEqual(reviews.map((r) => r.id));
    expect(found.every((f) => f.close)).toBe(true);
  });

  it("finds a city, a country or a word, without minding accents or capitals", () => {
    const by = (query: string) =>
      ids(searchReviews(reviews, PLACES, { ...NO_FILTER, query })).map((id) => id.split("-")[0]);
    expect(by("dakar")).toEqual(["dakar"]);
    expect(by("senegal")).toEqual(["dakar"]);
    expect(by("EMBOUTEILLAGES")).toEqual(["nairobi"]);
    expect(by("tres anime")).toEqual(["accra"]);
  });

  it("finds a word said in a reply", () => {
    const withReply = [
      review("accra", "Bien.", { replies: [review("accra", "Le quartier Osu est top.")] }),
      ...reviews,
    ];
    const found = searchReviews(withReply, PLACES, { ...NO_FILTER, query: "osu" });
    expect(found).toHaveLength(1);
  });

  it("keeps only the city chosen, even when another review names it", () => {
    const naming = [review("accra", "Moins cher que Dakar."), ...reviews];
    const found = searchReviews(naming, PLACES, { ...NO_FILTER, city: "dakar" });
    expect(found.map((f) => f.review.city)).toEqual(["dakar"]);
  });

  it("keeps only the region chosen", () => {
    const found = searchReviews(reviews, PLACES, { ...NO_FILTER, zone: "ouest" });
    expect(found.map((f) => f.review.city)).toEqual(["dakar", "accra"]);
  });

  it("puts the closest temperaments first, then the others, then reviews without one", () => {
    const found = searchReviews(reviews, PLACES, { ...NO_FILTER, temperament: "Exploration" });
    expect(found.map((f) => f.review.city)).toEqual(["nairobi", "marrakech", "dakar", "accra"]);
    expect(found.map((f) => f.close)).toEqual([true, true, false, false]);
  });
});

describe("the cities that come back in the reviews found", () => {
  it("counts, once per review, its city and the cities of its author's top three", () => {
    const found = searchReviews(
      [
        review("dakar", "a", { top: top("dakar", "accra", "nairobi") }),
        review("accra", "b", { top: top("dakar", "accra") }),
        review("dakar", "c"),
      ],
      PLACES,
      NO_FILTER,
    );
    expect(risingCities(found, PLACES)).toEqual([
      { slug: "dakar", name: "Dakar", count: 3 },
      { slug: "accra", name: "Accra", count: 2 },
      { slug: "nairobi", name: "Nairobi", count: 1 },
    ]);
  });

  it("only listens to the reviews close to the temperament chosen", () => {
    const found = searchReviews(
      [review("nairobi", "a", { profile: EXPLORER }), review("dakar", "b", { profile: REFUGE })],
      PLACES,
      { ...NO_FILTER, temperament: "Exploration" },
    );
    expect(risingCities(found, PLACES).map((c) => c.slug)).toEqual(["nairobi"]);
  });
});
