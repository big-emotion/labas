// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { KEEP_FOR, migrate, purge, type Db } from "./accounts";
import { newsList } from "./news";

let db: Db;
let clock: number;
let list: ReturnType<typeof newsList>;

beforeEach(async () => {
  const pg = new PGlite();
  db = { query: (sql, params) => pg.query(sql, params as never[]) as never };
  await migrate(db);
  clock = Date.UTC(2026, 10, 17, 12);
  list = newsList(db, () => clock);
});

const subscribers = async () =>
  (await db.query<{ email: string }>("select email from news_subscribers order by email")).rows.map(
    (r) => r.email,
  );

describe("the news list, kept in Là-bas's own database", () => {
  it("adds a confirmed address once, however many times it is confirmed", async () => {
    await list.addToList("awa@exemple.fr");
    await list.addToList("awa@exemple.fr");
    await list.addToList("binta@exemple.fr");
    expect(await subscribers()).toEqual(["awa@exemple.fr", "binta@exemple.fr"]);
  });

  it("removes an address, and removing it twice is harmless", async () => {
    await list.addToList("awa@exemple.fr");
    await list.removeFromList("awa@exemple.fr");
    await list.removeFromList("awa@exemple.fr");
    expect(await subscribers()).toEqual([]);
  });

  // The privacy page promises it: an address is erased three years after it last confirmed.
  it("erases an address three years after its last confirmation", async () => {
    await list.addToList("awa@exemple.fr");
    clock += KEEP_FOR - 1000;
    await list.addToList("binta@exemple.fr");
    await purge(db, clock);
    expect(await subscribers()).toEqual(["awa@exemple.fr", "binta@exemple.fr"]);
    clock += 2000;
    await purge(db, clock);
    expect(await subscribers()).toEqual(["binta@exemple.fr"]);
  });
});
