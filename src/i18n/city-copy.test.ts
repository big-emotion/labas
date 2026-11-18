import { describe, expect, it } from "vitest";
import { CITIES } from "../lib/cities";
import { cityCopy } from "./city-copy";

const capeTown = CITIES.find((city) => city.name === "Le Cap")!;

describe("a city's card copy", () => {
  it("is the data itself in French", () => {
    expect(cityCopy(capeTown, "fr")).toMatchObject({ name: "Le Cap", tagline: capeTown.tagline });
  });

  it("names the city and its country in English", () => {
    expect(cityCopy(capeTown, "en")).toMatchObject({ name: "Cape Town", country: "South Africa" });
  });
});
