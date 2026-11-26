import { describe, expect, it } from "vitest";
import { TESTIMONIES, agreedLean, gapsIn, ledgerProblems, type Testimony } from "./testimonies";

function testimony(id: string, overrides: Partial<Testimony> = {}): Testimony {
  return {
    id,
    city: "lagos",
    received: "2026-11-26",
    experienced: "2026-08",
    medium: "screenshot",
    context: "Comment under a public video about moving to Lagos",
    url: null,
    witness: "Returnee, two years in the city, with children",
    claims: [{ about: "utilities", leans: "lower", says: "Power cuts every day in Yaba." }],
    ...overrides,
  };
}

describe("agreedLean", () => {
  it("does not call one person's word an agreement", () => {
    expect(agreedLean([testimony("a")], "lagos", "utilities")).toBeNull();
  });

  it("agrees on a direction once two people say the same", () => {
    expect(agreedLean([testimony("a"), testimony("b")], "lagos", "utilities")).toBe("lower");
  });

  it("counts a person once, however many times they repeat themselves", () => {
    const insistent = testimony("a", {
      claims: [
        { about: "utilities", leans: "lower", says: "Power cuts every day." },
        { about: "utilities", leans: "lower", says: "Water is cut as well." },
      ],
    });

    expect(agreedLean([insistent], "lagos", "utilities")).toBeNull();
  });

  it("agrees on nothing while two accounts contradict each other", () => {
    const content = testimony("c", {
      claims: [{ about: "utilities", leans: "higher", says: "Never a cut in three years." }],
    });

    expect(agreedLean([testimony("a"), testimony("b"), content], "lagos", "utilities")).toBeNull();
  });

  it("agrees on nothing when as many people find the score right", () => {
    const fine = (id: string) =>
      testimony(id, {
        claims: [
          { about: "utilities", leans: "same", says: "Cuts now and then, as the site says." },
        ],
      });

    expect(
      agreedLean([testimony("a"), testimony("b"), fine("c"), fine("d")], "lagos", "utilities"),
    ).toBeNull();
  });

  it("keeps a city's accounts and a criterion's accounts to themselves", () => {
    const ledger = [testimony("a"), testimony("b")];

    expect(agreedLean(ledger, "accra", "utilities")).toBeNull();
    expect(agreedLean(ledger, "lagos", "internet")).toBeNull();
  });
});

describe("gapsIn", () => {
  it("lists what readers bring up that the site does not cover, the most told first", () => {
    const uncovered = (id: string, city: string, topic: string) =>
      testimony(id, { city, claims: [{ about: "uncovered", topic, says: "Told at length." }] });

    const gaps = gapsIn([
      uncovered("a", "lagos", "loneliness"),
      uncovered("b", "accra", "traffic"),
      uncovered("c", "accra", "loneliness"),
      testimony("d"),
    ]);

    expect(gaps).toEqual([
      { topic: "loneliness", testimonies: 2, cities: ["accra", "lagos"] },
      { topic: "traffic", testimonies: 1, cities: ["accra"] },
    ]);
  });
});

describe("ledgerProblems", () => {
  it("accepts an account that names its city, its day and what it bears on", () => {
    expect(ledgerProblems([testimony("a")])).toEqual([]);
  });

  it("refuses a city the site does not have", () => {
    expect(ledgerProblems([testimony("a", { city: "atlantis" })])).toEqual([
      "a: unknown city « atlantis »",
    ]);
  });

  it("refuses two accounts under one id", () => {
    expect(ledgerProblems([testimony("a"), testimony("a")])).toEqual(["a: id used twice"]);
  });

  it("refuses an account with no day of reception", () => {
    expect(ledgerProblems([testimony("a", { received: "last week" })])).toEqual([
      "a: received must be a YYYY-MM-DD date",
    ]);
  });

  it("refuses a claim on a score that does not say which way it leans", () => {
    const vague = testimony("a", { claims: [{ about: "safety", says: "Felt fine at night." }] });

    expect(ledgerProblems([vague])).toEqual(["a: a claim about « safety » must say how it leans"]);
  });

  it("refuses an uncovered claim that does not name its topic", () => {
    const untitled = testimony("a", { claims: [{ about: "uncovered", says: "Felt lonely." }] });

    expect(ledgerProblems([untitled])).toEqual(["a: an uncovered claim must name its topic"]);
  });

  it("refuses a subject the site does not know", () => {
    const stray = testimony("a", {
      claims: [{ about: "weather" as never, leans: "lower", says: "Too hot." }],
    });

    expect(ledgerProblems([stray])).toEqual(["a: unknown subject « weather »"]);
  });

  it("refuses an address that is not a public link", () => {
    expect(ledgerProblems([testimony("a", { url: "whatsapp group" })])).toEqual([
      "a: url must be a public http(s) link or null",
    ]);
  });

  // The repository is public: the people quoted never agreed to appear in it.
  it.each([
    ["a handle", { witness: "@kofi_in_accra, two years there" }],
    ["an e-mail address", { context: "Mail from someone@example.org" }],
    ["a phone number", { context: "WhatsApp message from +33 6 12 34 56 78" }],
  ])("refuses %s in what is written about the person", (_, overrides) => {
    expect(ledgerProblems([testimony("a", overrides)])).toEqual([
      "a: names someone (handle, e-mail or phone number)",
    ]);
  });

  it("refuses a handle inside a claim too", () => {
    const quoting = testimony("a", {
      claims: [{ about: "utilities", leans: "lower", says: "As @ama_lagos says, cuts daily." }],
    });

    expect(ledgerProblems([quoting])).toEqual([
      "a: names someone (handle, e-mail or phone number)",
    ]);
  });
});

describe("the testimony ledger", () => {
  it("holds only accounts that pass every check", () => {
    expect(ledgerProblems(TESTIMONIES)).toEqual([]);
  });
});
