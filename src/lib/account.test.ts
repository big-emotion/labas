import { describe, expect, it } from "vitest";
import { type Answers, bestMatches } from "./ranking";
import { QUESTIONS } from "./questions";
import { dateLabel, journeySummary, resumeHref, saveBody } from "./account";
import { outcomeOf } from "./newsletter";

const first = (id: string) => QUESTIONS.find((q) => q.id === id)!.choices[0].value;

describe("« Reprendre plus tard »", () => {
  const answers = { order: 1 } as Answers;

  it("sends the address, the explicit consent, the news choice and the journey", () => {
    expect(
      saveBody(
        { email: " awa@exemple.fr ", consent: true, news: false, website: "" },
        "quick",
        answers,
      ),
    ).toEqual({
      email: "awa@exemple.fr",
      consent: true,
      news: false,
      website: "",
      journey: { kind: "quick", answers },
    });
  });

  it("saves nothing without the consent box, which names the sensitive answers", () => {
    expect(
      saveBody(
        { email: "awa@exemple.fr", consent: false, news: true, website: "" },
        "quick",
        answers,
      ),
    ).toBeNull();
    expect(
      saveBody({ email: "awa", consent: true, news: false, website: "" }, "quick", answers),
    ).toBeNull();
  });

  it("says what to fix when the form is refused", () => {
    expect(outcomeOf(400, "save")).toEqual({
      sent: false,
      message: "Vérifiez votre adresse et cochez la case d'accord, puis réessayez.",
    });
  });
});

describe("a journey in Mon espace", () => {
  it("names its kind and counts its answers", () => {
    const summary = journeySummary({
      id: "j1",
      kind: "quick",
      answers: { order: 1, together: 0.5 },
    });
    expect(summary.title).toBe("Quiz rapide");
    expect(summary.answered).toBe("2 réponses");
    expect(journeySummary({ id: "j2", kind: "deep", answers: { order: 1 } }).title).toBe(
      "Questionnaire complet",
    );
    expect(journeySummary({ id: "j2", kind: "deep", answers: { order: 1 } }).answered).toBe(
      "1 réponse",
    );
  });

  it("shows the three cities the answers give, as the quiz does, once enough is answered", () => {
    const answers = { project: first("project"), order: 1, together: 0.5, saturday: 1 } as Answers;
    const top = bestMatches(answers, 3).map((m) => m.city.name);
    expect(journeySummary({ id: "j1", kind: "quick", answers }).cities.map((c) => c.name)).toEqual(
      top,
    );
    expect(journeySummary({ id: "j1", kind: "quick", answers: { order: 1 } }).cities).toEqual([]);
  });

  it("resumes in the full questionnaire, which picks up the answers already given", () => {
    expect(resumeHref("8d3c")).toBe("/approfondir/?parcours=8d3c");
  });

  it("writes dates the French way", () => {
    expect(dateLabel("2029-11-16T12:00:00.000Z")).toBe("16 novembre 2029");
  });
});
