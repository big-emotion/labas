// Prints what a carousel may name, from the site's own ranking (see the labas-social skill).
//   npm run social -- reveal '{"order":1,"crowds":0}' [count]
//   npm run social -- twins abidjan nightlife,culture [count]
//   npm run social -- twins dakar+abidjan nightlife,culture,returnees [count]
import { revealFor, twinsOf } from "../src/lib/carousel";
import { CRITERION_KEYS, type CriterionKey } from "../src/lib/cities";

const [command, subject, third, fourth] = process.argv.slice(2);

if (command === "reveal" && subject) {
  for (const [i, r] of revealFor(JSON.parse(subject), Number(third ?? 3)).entries()) {
    console.log(`${i + 1}. ${r.city} (${r.country}) — ${r.percent} %`);
  }
} else if (command === "twins" && subject && third) {
  const criteria = third.split(",") as CriterionKey[];
  const unknown = criteria.filter((c) => !CRITERION_KEYS.includes(c));
  if (unknown.length) throw new Error(`Unknown criteria: ${unknown.join(", ")}`);
  for (const [i, t] of twinsOf(subject.split("+"), criteria, Number(fourth ?? 5)).entries()) {
    const levels = t.levels.map((l) => `${l.criterion} ${l.level}`).join(", ");
    console.log(`${i + 1}. ${t.city} (${t.country}) — gap ${t.gap} — ${levels}`);
  }
} else {
  console.error(
    "Usage: reveal '<answers JSON>' [count] | twins <slug[+slug...]> <criterion,...> [count]",
  );
  process.exit(1);
}
