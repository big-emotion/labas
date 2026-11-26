// Prints what the testimony ledger says, for the labas-testimony skill.
//   npm run testimony -- lagos    each score of the city, and where two accounts agree
//   npm run testimony -- gaps     what people tell that the site does not cover
import { CITIES, CRITERION_KEYS } from "../src/lib/cities";
import { TESTIMONIES, agreedLean, gapsIn, ledgerProblems } from "../src/lib/testimonies";

const [subject] = process.argv.slice(2);
const problems = ledgerProblems(TESTIMONIES);
const city = CITIES.find((candidate) => candidate.slug === subject);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
} else if (subject === "gaps") {
  for (const gap of gapsIn(TESTIMONIES)) {
    console.log(`${gap.topic} — ${gap.testimonies} account(s) — ${gap.cities.join(", ")}`);
  }
} else if (city) {
  const accounts = TESTIMONIES.filter((testimony) => testimony.city === city.slug);
  console.log(`${city.name}: ${accounts.length} account(s)`);
  for (const key of CRITERION_KEYS) {
    const score = city.scores[key];
    const told = accounts.flatMap((testimony) =>
      testimony.claims
        .filter((claim) => claim.about === key)
        .map((claim) => `    ${testimony.id} (${claim.leans}): ${claim.says}`),
    );
    const agreed = agreedLean(TESTIMONIES, city.slug, key);
    console.log(
      `  ${key}: level ${score.level ?? "unknown"}, ${score.confidence}` +
        (agreed ? ` — two or more accounts lean ${agreed}` : ""),
    );
    if (told.length) console.log(told.join("\n"));
  }
  for (const testimony of accounts) {
    for (const claim of testimony.claims.filter((c) => !isScore(c.about))) {
      console.log(`  ${claim.about}${claim.topic ? ` (${claim.topic})` : ""}: ${claim.says}`);
    }
  }
} else {
  console.error("Usage: <city slug> | gaps");
  process.exit(1);
}

function isScore(about: string): boolean {
  return (CRITERION_KEYS as readonly string[]).includes(about);
}
