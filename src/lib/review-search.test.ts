import { describe, expect, it } from "vitest";
import type { Profile, Reaction } from "./reactions";
import { citiesOfZone, pageLinks, pageOf, searchReviews, type Place } from "./review-search";

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

const NO_FILTER = {
  query: "",
  city: null,
  zone: null,
  temperament: null,
  sort: "recents" as const,
};
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

describe("sorting the reviews", () => {
  const liked = (n: number) => ({ coeur: n });
  const reviews = [
    review("dakar", "a", { marks: liked(1) }),
    review("accra", "b", { marks: { coeur: 2, bravo: 3 } }),
    review("nairobi", "c", { replies: [review("nairobi", "r1"), review("nairobi", "r2")] }),
    review("marrakech", "d", { marks: liked(1), replies: [review("marrakech", "r3")] }),
  ];
  const cities = (sort: "recents" | "anciens" | "aimes" | "moins-aimes" | "reponses") =>
    searchReviews(reviews, PLACES, { ...NO_FILTER, sort }).map((f) => f.review.city);

  it("puts the newest first by default, and the oldest first when asked", () => {
    expect(cities("recents")).toEqual(["dakar", "accra", "nairobi", "marrakech"]);
    expect(cities("anciens")).toEqual(["marrakech", "nairobi", "accra", "dakar"]);
  });

  it("counts every friendly mark for the most and the least liked, the newest first on a tie", () => {
    expect(cities("aimes")).toEqual(["accra", "dakar", "marrakech", "nairobi"]);
    expect(cities("moins-aimes")).toEqual(["nairobi", "dakar", "marrakech", "accra"]);
  });

  it("puts the reviews with the most replies first", () => {
    expect(cities("reponses")).toEqual(["nairobi", "marrakech", "dakar", "accra"]);
  });

  it("keeps the temperament first: the sort orders reviews equally close", () => {
    const close = [
      review("dakar", "x", { profile: EXPLORER }),
      review("accra", "y", { profile: EXPLORER, marks: liked(5) }),
      review("nairobi", "z", { profile: REFUGE, marks: liked(9) }),
    ];
    const found = searchReviews(close, PLACES, {
      ...NO_FILTER,
      temperament: "Exploration",
      sort: "aimes",
    });
    expect(found.map((f) => f.review.city)).toEqual(["accra", "dakar", "nairobi"]);
  });
});

describe("pages of reviews", () => {
  const many = Array.from({ length: 45 }, (_, i) => ({
    review: review("dakar", `n${i}`),
    close: true,
  }));

  it("shows twenty a page, and says how many pages there are", () => {
    const first = pageOf(many, 1);
    expect(first.items).toHaveLength(20);
    expect(first).toMatchObject({ page: 1, pages: 3 });
    expect(pageOf(many, 3).items).toHaveLength(5);
  });

  it("brings a page out of range back to the nearest one", () => {
    expect(pageOf(many, 9).page).toBe(3);
    expect(pageOf(many, 0).page).toBe(1);
    expect(pageOf(many, Number.NaN).page).toBe(1);
    expect(pageOf([], 4)).toMatchObject({ items: [], page: 1, pages: 1 });
  });

  it("numbers every page when there are few, and keeps the ends and the neighbours otherwise", () => {
    expect(pageLinks(2, 4)).toEqual([1, 2, 3, 4]);
    expect(pageLinks(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageLinks(1, 12)).toEqual([1, 2, "…", 12]);
    expect(pageLinks(12, 12)).toEqual([1, "…", 11, 12]);
  });
});

describe("the cities of a region, for the list to pick one", () => {
  it("lists every city of the region with its number of reviews, the most reviewed first", () => {
    const reviews = [review("accra", "a"), review("accra", "b"), review("nairobi", "c")];
    expect(citiesOfZone(reviews, PLACES, "ouest")).toEqual([
      { slug: "accra", name: "Accra", count: 2 },
      { slug: "dakar", name: "Dakar", count: 0 },
    ]);
  });
});
