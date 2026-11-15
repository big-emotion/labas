import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { readSituation } from "./situation";

const VALID: Record<string, Set<unknown>> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, new Set(q.choices.map((c) => c.value))]),
);

describe("reading a free-text situation into quiz answers", () => {
  it("understands a family that wants the sea and a modest budget", () => {
    const { answers } = readSituation(
      "On a deux enfants, je suis infirmière, on veut la mer et pas trop cher, on parle français.",
    );
    expect(answers).toMatchObject({
      family: "parents",
      job: "soin",
      landscape: "beach",
      budget: "serre",
      language: "fr",
    });
  });

  it("understands someone remote, alone, who wants to try a lively city", () => {
    const { answers } = readSituation(
      "Je suis en télétravail, seule, et je voudrais tester quelques mois dans une ville qui bouge.",
    );
    expect(answers).toMatchObject({ job: "remote", family: "celib", project: "tester", size: 3 });
  });

  it("understands a return for good with a business to start", () => {
    const { answers } = readSituation(
      "Je veux rentrer au pays pour de bon et créer mon entreprise.",
    );
    expect(answers).toMatchObject({ project: "installer", job: "entre" });
  });

  it("does not read « sans enfants » as moving with children", () => {
    expect(readSituation("En couple, sans enfants.").answers.family).toBe("couple");
  });

  it("never sets a health or LGBT filter, whatever the text says", () => {
    const { answers } = readSituation(
      "Je suis lesbienne et j'ai besoin de soins réguliers, je veux un pays sûr pour moi.",
    );
    expect(answers).not.toHaveProperty("excludeCriminalising");
    expect(answers).not.toHaveProperty("specialistCare");
  });

  it("only produces answers the quiz itself offers", () => {
    const { answers } = readSituation(
      "Couple avec enfants, salarié, on aime danser, la montagne, un climat doux, anglais, " +
        "petit budget, une ville à taille humaine, la sécurité et l'école d'abord.",
    );
    for (const [question, value] of Object.entries(answers)) {
      const values = Array.isArray(value) ? value : [value];
      for (const v of values)
        expect(VALID[question]?.has(v), `${question}=${String(v)}`).toBe(true);
    }
  });

  it("keeps at most three priorities, in the order they were written", () => {
    const { answers } = readSituation(
      "Ce qui compte : la sécurité, l'école, retrouver d'autres repats, et voyager facilement.",
    );
    expect(answers.priorities).toEqual(["safety", "healthAndSchools", "diaspora"]);
  });

  it("says which words led to each answer", () => {
    const { understood } = readSituation("Je suis en télétravail.");
    expect(understood).toContainEqual({ question: "job", phrase: "télétravail" });
  });

  it("understands nothing in an empty text", () => {
    expect(readSituation("   ")).toEqual({ answers: {}, understood: [] });
  });
});
