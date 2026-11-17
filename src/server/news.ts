import type { Db } from "./accounts";
import type { Mailer } from "./subscribe";

/**
 * The confirmed news addresses, in Là-bas's own database rather than at an e-mailing provider
 * (operator, 2026-11-17): the list follows the site whatever sends the mail, and leaves with no
 * export. Only an address that opened its confirmation link gets here (double opt-in).
 */
export function newsList(
  db: Db,
  now: () => number = Date.now,
): Pick<Mailer, "addToList" | "removeFromList"> {
  return {
    async addToList(email) {
      // A second confirmation renews the three years the privacy page promises.
      await db.query(
        `insert into news_subscribers (email, confirmed_at) values ($1, $2)
         on conflict (email) do update set confirmed_at = excluded.confirmed_at`,
        [email, new Date(now()).toISOString()],
      );
    },
    async removeFromList(email) {
      await db.query("delete from news_subscribers where email = $1", [email]);
      // Leaving by the e-mail's link also turns the news off in « Mon espace », if there is one.
      await db.query("update accounts set news = false where email = $1", [email]);
    },
  };
}
