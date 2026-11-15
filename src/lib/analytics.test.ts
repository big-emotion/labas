import { describe, expect, it } from "vitest";
import { answerEvent, plausibleScriptSrc } from "./analytics";

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

describe("the one anonymous event sent per quiz answer", () => {
  it("names the question and the answer, nothing else", () => {
    expect(answerEvent("project", "installer")).toEqual({
      name: "Réponse",
      props: { question: "project", answer: "installer" },
    });
  });

  it("joins a multiple answer and writes numbers as text", () => {
    expect(answerEvent("priorities", ["safety", "cost"])?.props.answer).toBe("safety,cost");
    expect(answerEvent("saturday", 0.5)?.props.answer).toBe("0.5");
  });

  it("never sends origin, family country, feeling at home or faith (sensitive data, GDPR art. 9)", () => {
    expect(answerEvent("origin", ["ouest"])).toBeNull();
    expect(answerEvent("countries", ["Sénégal"])).toBeNull();
    expect(answerEvent("kin", "much")).toBeNull();
    expect(answerEvent("faith", "muslim")).toBeNull();
  });

  it("never sends the opt-in filter on laws against homosexuality or a health need", () => {
    expect(answerEvent("excludeCriminalising", true)).toBeNull();
    expect(answerEvent("specialistCare", true)).toBeNull();
  });

  it("only sends answers to the quick-quiz questions", () => {
    expect(answerEvent("visaFreeOnly", true)).toBeNull();
    expect(answerEvent("anything", "x")).toBeNull();
  });

  it("sends nothing when a question is cleared", () => {
    expect(answerEvent("project", undefined)).toBeNull();
    expect(answerEvent("priorities", [])).toBeNull();
  });
});
