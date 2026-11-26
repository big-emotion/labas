import { describe, expect, it } from "vitest";
import { type Answers, bestMatches } from "./ranking";
import { QUESTIONS } from "./questions";
import {
  dateLabel,
  journeySummary,
  resultsHref,
  memberJourneyBody,
  offersSaving,
  resultsMailBody,
  resumeHref,
  saveBody,
} from "./account";
import { outcomeOf } from "./newsletter";

const first = (id: string) => QUESTIONS.find((q) => q.id === id)!.choices[0].value;

describe("when the quick quiz offers « M'envoyer mon parcours »", () => {
  it("waits for the fourth answer, so the first questions come uninterrupted", () => {
    expect(offersSaving(3)).toBe(false);
    expect(offersSaving(4)).toBe(true);
    expect(offersSaving(12)).toBe(true);
  });

  it("goes once the quiz is over: the result has its own e-mail", () => {
    expect(offersSaving(0)).toBe(false);
  });
});

describe("« Reprendre plus tard »", () => {
  const answers = { order: 1 } as Answers;

  const form = { email: " awa@exemple.fr ", consent: true, sensitive: false, news: false };
  const withOrigin = { ...answers, origin: [first("origin")] } as Answers;

  it("sends the address, the explicit consent, the news choice and the journey", () => {
    expect(saveBody({ ...form, website: "" }, "quick", answers, "en")).toEqual({
      email: "awa@exemple.fr",
      consent: true,
      sensitive: false,
      news: false,
      website: "",
      locale: "en",
      journey: { kind: "quick", answers },
    });
  });

  it("keeps the sensitive answers in the browser unless their own box is ticked", () => {
    expect(saveBody({ ...form, website: "" }, "quick", withOrigin, "fr")?.journey.answers).toEqual(
      answers,
    );
    expect(
      saveBody({ ...form, sensitive: true, website: "" }, "quick", withOrigin, "fr")?.journey
        .answers,
    ).toEqual(withOrigin);
  });

  it("saves nothing without the consent box", () => {
    expect(saveBody({ ...form, consent: false, website: "" }, "quick", answers, "fr")).toBeNull();
    expect(saveBody({ ...form, email: "awa", website: "" }, "quick", answers, "fr")).toBeNull();
  });

  it("sends the journey of a signed-in reader with the same separate box", () => {
    expect(memberJourneyBody("deep", withOrigin, false)).toEqual({
      kind: "deep",
      sensitive: false,
      answers,
    });
    expect(memberJourneyBody("deep", withOrigin, true).answers).toEqual(withOrigin);
  });

  it("says what to fix when the form is refused", () => {
    expect(outcomeOf(400, "save", "fr")).toEqual({
      sent: false,
      message: "Vérifiez votre adresse et cochez la case d'accord, puis réessayez.",
    });
  });
});

describe("a journey in Mon espace", () => {
  it("names its kind and counts its answers", () => {
    const summary = journeySummary(
      {
        id: "j1",
        kind: "quick",
        answers: { order: 1, together: 0.5 },
      },
      "fr",
    );
    expect(summary.title).toBe("Quiz rapide");
    expect(summary.answered).toBe("2 réponses");
    expect(journeySummary({ id: "j2", kind: "deep", answers: { order: 1 } }, "fr").title).toBe(
      "Questionnaire complet",
    );
    expect(journeySummary({ id: "j2", kind: "deep", answers: { order: 1 } }, "fr").answered).toBe(
      "1 réponse",
    );
  });

  it("shows the three cities the answers give, as the quiz does, once enough is answered", () => {
    const answers = { project: first("project"), order: 1, together: 0.5, saturday: 1 } as Answers;
    const top = bestMatches(answers, 3).map((m) => m.city.name);
    expect(
      journeySummary({ id: "j1", kind: "quick", answers }, "fr").cities.map((c) => c.name),
    ).toEqual(top);
    expect(journeySummary({ id: "j1", kind: "quick", answers: { order: 1 } }, "fr").cities).toEqual(
      [],
    );
  });

  it("resumes in the full questionnaire, which picks up the answers already given", () => {
    expect(resumeHref("8d3c", "fr")).toBe("/approfondir/?parcours=8d3c");
  });

  it("opens a journey on its result, the full ranking with the reasons for each city", () => {
    expect(resultsHref("8d3c", "fr")).toBe("/approfondir/?parcours=8d3c#vos-villes");
  });

  it("writes dates the French way", () => {
    expect(dateLabel("2029-11-16T12:00:00.000Z", "fr")).toBe("16 novembre 2029");
  });

  it("speaks English on the English pages, with English addresses", () => {
    const quick = journeySummary({ id: "j1", kind: "quick", answers: { order: 1 } }, "en");
    expect([quick.title, quick.answered]).toEqual(["Quick quiz", "1 answer"]);
    expect(journeySummary({ id: "j2", kind: "deep", answers: {} }, "en").answered).toBe(
      "0 answers",
    );
    expect(resultsHref("8d3c", "en")).toBe("/en/go-deeper/?parcours=8d3c#vos-villes");
    expect(dateLabel("2029-11-16T12:00:00.000Z", "en")).toBe("16 November 2029");
  });
});

describe("« Recevoir par e-mail », which keeps the result in Mon espace", () => {
  const link = "https://labas.africa/resultat/#r=abc";
  const answers = { order: 1, origin: [first("origin")], faith: "none" } as Answers;
  const form = { email: " awa@exemple.fr ", sensitive: false, news: true, website: "" };

  it("leaves origin and faith in the browser unless their own box is ticked", () => {
    expect(resultsMailBody(form, "quick", answers, link, "fr")).toEqual({
      email: "awa@exemple.fr",
      link,
      sensitive: false,
      news: true,
      website: "",
      locale: "fr",
      journey: { kind: "quick", answers: { order: 1 } },
    });
    expect(
      resultsMailBody({ ...form, sensitive: true }, "deep", answers, link, "en")?.journey.answers,
    ).toEqual(answers);
  });

  it("needs a real address only: the request is the reason to keep the result", () => {
    expect(resultsMailBody({ ...form, email: "awa" }, "quick", answers, link, "fr")).toBeNull();
  });
});
