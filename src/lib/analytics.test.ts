import { describe, expect, it } from "vitest";
import { answerEvent, finishedEvent, plausibleScriptSrc } from "./analytics";

describe("where the audience script comes from", () => {
  it("loads nothing when no site domain is configured", () => {
    expect(plausibleScriptSrc({})).toBeNull();
    expect(plausibleScriptSrc({ domain: "  " })).toBeNull();
  });

  it("uses the shared Big Emotion collector by default", () => {
    expect(plausibleScriptSrc({ domain: "labas.example" })).toBe(
      "https://stats.big-emotion.com/js/script.js",
    );
  });

  it("uses another collector when one is configured", () => {
    expect(
      plausibleScriptSrc({ domain: "labas.example", host: "https://stats.example.org/" }),
    ).toBe("https://stats.example.org/js/script.js");
  });
});

// The questions come in an order that depends on the answers, so the question alone does not say
// where readers stop: each answer also carries its path and its rank in it (operator, 2026-11-16).
const AT = { project: "decouvrir", step: 7 };

describe("the one anonymous event sent per quiz answer", () => {
  it("names the path, the rank in it, the question and the answer, nothing else", () => {
    expect(answerEvent("wants", ["beach"], AT)).toEqual({
      name: "Réponse",
      props: { parcours: "Vacances", etape: "07", question: "wants", answer: "beach" },
    });
  });

  it("starts the path with the project answer itself", () => {
    expect(answerEvent("project", "investir", { step: 1 })?.props).toMatchObject({
      parcours: "Investir",
      etape: "01",
    });
  });

  it("writes the rank on two digits, so the steps sort in order in any export", () => {
    expect(answerEvent("priorities", ["safety"], { ...AT, step: 12 })?.props.etape).toBe("12");
  });

  it("tells which path finished the quick quiz", () => {
    expect(finishedEvent("Questionnaire 1 terminé", "pied")).toEqual({
      name: "Questionnaire 1 terminé",
      props: { parcours: "Un pied ici, un pied là-bas" },
    });
  });

  it("joins a multiple answer and writes numbers as text", () => {
    expect(answerEvent("priorities", ["safety", "cost"], AT)?.props.answer).toBe("safety,cost");
    expect(answerEvent("saturday", 0.5, AT)?.props.answer).toBe("0.5");
  });

  it("never sends origin, family country, feeling at home or faith (sensitive data, GDPR art. 9)", () => {
    expect(answerEvent("origin", ["ouest"], AT)).toBeNull();
    expect(answerEvent("countries", ["Sénégal"], AT)).toBeNull();
    expect(answerEvent("kin", "much", AT)).toBeNull();
    expect(answerEvent("faith", "muslim", AT)).toBeNull();
  });

  it("never sends the opt-in filter on laws against homosexuality or a health need", () => {
    expect(answerEvent("excludeCriminalising", true, AT)).toBeNull();
    expect(answerEvent("specialistCare", true, AT)).toBeNull();
  });

  it("only sends answers to the quick-quiz questions", () => {
    expect(answerEvent("visaFreeOnly", true, AT)).toBeNull();
    expect(answerEvent("anything", "x", AT)).toBeNull();
  });

  it("sends nothing when a question is cleared", () => {
    expect(answerEvent("project", undefined, AT)).toBeNull();
    expect(answerEvent("priorities", [], AT)).toBeNull();
  });
});
