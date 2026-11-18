import { describe, expect, it } from "vitest";
import { type AdminReview, byCity, funnel, toReread } from "./admin";

const review = (fields: Partial<AdminReview>): AdminReview => ({
  id: "r",
  city: "dakar",
  name: "Awa",
  text: "Bien.",
  createdAt: "2026-11-10T10:00:00.000Z",
  reports: 0,
  hidden: false,
  replyTo: null,
  mention: null,
  marks: {},
  ...fields,
});
const NAMES = { dakar: "Dakar", accra: "Accra", abidjan: "Abidjan" };

describe("the reviews grouped by city", () => {
  const reviews = [
    review({ id: "a", city: "dakar", createdAt: "2026-11-17T10:00:00.000Z" }),
    review({ id: "b", city: "accra", createdAt: "2026-11-12T10:00:00.000Z", reports: 2 }),
    review({ id: "c", city: "dakar", replyTo: "a", createdAt: "2026-11-18T09:00:00.000Z" }),
    review({ id: "d", city: "accra", createdAt: "2026-11-11T10:00:00.000Z", hidden: true }),
  ];

  it("puts the city with the newest activity first, its reviews newest first with their replies", () => {
    const groups = byCity(reviews, NAMES);
    expect(groups.map((g) => g.name)).toEqual(["Dakar", "Accra"]);
    expect(groups[0]).toMatchObject({ reviews: 1, replies: 1, flagged: 0 });
    expect(groups[0].threads[0].review.id).toBe("a");
    expect(groups[0].threads[0].replies.map((r) => r.id)).toEqual(["c"]);
    expect(groups[1]).toMatchObject({ reviews: 2, flagged: 2 });
    expect(groups[1].threads.map((t) => t.review.id)).toEqual(["b", "d"]);
  });
});

describe("what to reread", () => {
  it("lists reported or hidden reviews and replies, most reported first", () => {
    const list = toReread([
      review({ id: "ok" }),
      review({ id: "once", reports: 1 }),
      review({ id: "hidden", hidden: true, reports: 3 }),
      review({ id: "reply", replyTo: "ok", reports: 2 }),
    ]);
    expect(list.map((r) => r.id)).toEqual(["hidden", "reply", "once"]);
  });
});

describe("the quiz funnel", () => {
  it("gives each step and its share of the visitors", () => {
    const steps = funnel(200, {
      Réponse: { visitors: 80, events: 400 },
      "Questionnaire 1 terminé": { visitors: 40, events: 41 },
      "Questionnaire complet terminé": { visitors: 4, events: 4 },
    });
    expect(steps).toEqual([
      { label: "Visiteurs", visitors: 200, share: "100 %" },
      { label: "Ont répondu une fois", visitors: 80, share: "40 %" },
      { label: "Quiz rapide terminé", visitors: 40, share: "20 %" },
      { label: "Questionnaire complet terminé", visitors: 4, share: "2 %" },
    ]);
  });

  it("counts a step nobody reached as zero, and no visitors as no share", () => {
    expect(funnel(0, {}).map((s) => s.share)).toEqual(["–", "–", "–", "–"]);
  });
});
