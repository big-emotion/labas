import { describe, expect, it } from "vitest";
import { feedbackBody } from "./feedback";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};

describe("what the feedback tab sends", () => {
  it("sends the kind, the text and the page, and the address only when one is typed", () => {
    expect(feedbackBody(form({ kind: "site", text: "  Clair.  ", email: "" }), "/villes/")).toEqual(
      {
        kind: "site",
        text: "Clair.",
        page: "/villes/",
      },
    );
    expect(
      feedbackBody(form({ kind: "message", text: "Bonjour", email: " awa@exemple.fr " }), "/"),
    ).toEqual({ kind: "message", text: "Bonjour", page: "/", email: "awa@exemple.fr" });
  });

  it("passes the hidden field on, so the server can spot a robot", () => {
    expect(feedbackBody(form({ kind: "site", text: "x", website: "spam" }), "/").website).toBe(
      "spam",
    );
  });

  it("sends nothing else, whatever else the page holds", () => {
    const body = feedbackBody(
      form({ kind: "site", text: "x", answers: "{}", origin: "ouest" }),
      "/",
    );
    expect(Object.keys(body).sort()).toEqual(["kind", "page", "text"]);
  });
});
