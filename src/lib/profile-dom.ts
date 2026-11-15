import type { Answers } from "./ranking";
import { archetypeOf } from "./temperament";

/** Fills every profile block (components/TemperamentProfile.astro) on the page. */
export function showProfile(answers: Answers): void {
  const archetype = archetypeOf(answers);
  for (const block of document.querySelectorAll<HTMLElement>("[data-profile]")) {
    block.hidden = !archetype;
    if (!archetype) continue;
    block.querySelector("[data-profile-name]")!.textContent = archetype.name;
    block.querySelector("[data-profile-text]")!.textContent = archetype.text;
    block.querySelector("[data-profile-traits]")!.replaceChildren(
      ...archetype.traits.map((trait) => {
        const item = document.createElement("li");
        const label = document.createElement("span");
        const range = document.createElement("small");
        label.textContent = trait.name;
        range.textContent = trait.range;
        label.append(range);
        const meter = document.createElement("span");
        meter.className = "meter";
        const fill = document.createElement("i");
        fill.style.width = `${Math.max(8, Math.round(trait.value * 100))}%`;
        meter.append(fill);
        item.append(label, meter);
        return item;
      }),
    );
  }
}
