// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bestMatches, type Answers } from "../lib/ranking";
import { readShared, resultLink, sharedResult } from "../lib/shared-result";
import { resultsEmail } from "./emails";

describe("the results e-mail", () => {
  it("writes each city's neighbourhood lines as text, the lines that fit only", () => {
    const answers: Answers = { project: "decouvrir", saturday: 1, order: 0.5, together: 1 };
    const top = bestMatches(answers, 3);
    const link = resultLink(answers, top);
    const shared = sharedResult(readShared(new URL(link).hash)!)!;
    const mail = resultsEmail("reader@example.org", shared, link, "https://labas.africa");
    for (const body of [mail.text, mail.html]) expect(body).not.toContain("[object Object]");
    const fits = shared.cities[0].lines.find((line) => !line.weak);
    if (fits) expect(mail.text).toContain(fits.text);
    for (const weak of shared.cities.flatMap((c) => c.lines.filter((line) => line.weak)))
      expect(mail.text).not.toContain(weak.text);
  });
});
