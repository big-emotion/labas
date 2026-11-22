# Deploy — labas.africa on the VPS

How Là-bas goes live, ships and rolls back. Same host and conventions as the other Big Emotion sites, so nothing here is new
infrastructure.

## The host

|               |                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| VPS           | the application host; name, IPv4 and SSH port are in the operator's private notes                                                  |
| Login         | `ubuntu` on the host's non-default SSH port (in the operator's private notes)                                                      |
| Reverse proxy | Traefik, own compose project, ACME resolver `myresolver`, external network `proxy`                                                 |
| App directory | `/home/ubuntu/labas/` — only `docker-compose.yml`; CI ships it with each deploy                                                    |
| Container     | `labas`, image `labas:live`: nginx serving the static Astro build                                                                  |
| Container     | `labas-subscribe`, image `labas-subscribe:live`: the mail and accounts service: `/api/nouveautes`, `/api/resultats`, `/api/compte` |
| Container     | `labas-db`, Postgres 17, volume `labas-db`: saved journeys; internal network only                                                  |

The VPS never builds: CI builds the image (`Dockerfile`), ships it as a tarball and restarts the
container (`.github/workflows/deploy-production.yml`).

**What the mail service trusts from Traefik.** Its per-connection limit (5 sends an hour) keys on
`X-Real-IP`. Traefik deletes that header when a client sends it and writes the real address
instead, unless its entry point sets `forwardedHeaders.insecure` or lists the whole internet in
`forwardedHeaders.trustedIPs`. Keep both off on the shared Traefik, and publish no port of
`labas-subscribe`: otherwise anyone can pick their own key and the limit stops counting. Check on
the host: `docker inspect <traefik container> --format '{{.Args}}'` (or its static config file)
must show neither option. The per-address limit (3 a day) holds either way.

## What deploys

```
git push origin main        → CI only.
git tag v0.1.0 && git push origin v0.1.0  → deploy-production.yml → https://labas.africa
Actions → Deploy production → Run workflow (ref)  → redeploy or roll back to that ref
```

## One-time setup (in this order)

**1. DNS first.** Traefik asks Let's Encrypt for a certificate on the first request; if the name
does not resolve to the VPS yet, every retry fails and rate limits follow. Until the domain moves
to the hosting provider (below), the zone is at the current registrar:

| Name                 | Type | Value                                                                             |
| -------------------- | ---- | --------------------------------------------------------------------------------- |
| `labas.africa` (`@`) | A    | `<server-ip>`                                                                     |
| `www`                | A    | `<server-ip>`                                                                     |
| `@`                  | AAAA | delete (the registrar's default); the other sites on this VPS have no IPv6 record |

Check: `dig +short labas.africa A` and `dig +short www.labas.africa A` both answer `<server-ip>`.

**2. The app directory on the VPS.**

```bash
ssh -p <port> ubuntu@<server-ip> 'mkdir -p ~/labas'
```

**3. A dedicated deploy key and the repository settings.**

```bash
ssh-keygen -t ed25519 -f ./labas_deploy -N "" -C "github-actions-deploy@labas"
ssh-copy-id -i ./labas_deploy.pub -p <port> ubuntu@<server-ip>
gh secret set DEPLOY_SSH_KEY --repo big-emotion/labas < ./labas_deploy
gh variable set DEPLOY_HOST --repo big-emotion/labas --body <server-ip>
gh variable set DEPLOY_PORT --repo big-emotion/labas --body <port>
gh variable set DEPLOY_USER --repo big-emotion/labas --body ubuntu
gh variable set DEPLOY_KNOWN_HOSTS --repo big-emotion/labas --body "$(ssh-keyscan -p <port> <server-ip> 2>/dev/null)"
rm -f ./labas_deploy ./labas_deploy.pub
```

Optional, once the site is added in Plausible: `gh variable set PLAUSIBLE_DOMAIN --body labas.africa`
(and `PLAUSIBLE_HOST` only if the collector is not `https://stats.big-emotion.com`). Each
event the site sends shows in Plausible only once it is declared as a goal (Settings → Goals →
Add goal → Custom event), one per name listed in `GOALS` (`src/lib/analytics.ts`).

**4. The news sign-up and the results e-mail, when you want them on.** The service
(`src/server/subscribe.ts`) sends through Microsoft Graph as the Là-bas mailbox of the Big
Emotion Microsoft 365 tenant, reusing the tenant's Entra app (the one big-emotion.com sends
with). It mails the confirmation link and adds only confirmed addresses to the news list, kept in
Postgres (`news_subscribers`, `src/server/news.ts`): the news sign-up therefore needs step 5.
Without these settings it answers 503 and the site shows no sign-up block.

1. In Microsoft 365 (admin center → Settings → Domains): add `labas.africa`, prove it with the
   TXT record Microsoft gives, then add the SPF include (`include:spf.protection.outlook.com`)
   and the two DKIM CNAMEs (`selector1._domainkey`, `selector2._domainkey`) at the DNS host
   that holds the zone. Keep the current MX and SPF includes while mail is still received
   where it is today; in Exchange admin, set the domain as _Internal relay_ so mail to other
   `@labas.africa` addresses still reaches that inbox. Turn DKIM signing on for the domain once
   the CNAMEs resolve.
2. Create a shared mailbox `bonjour@labas.africa` (no licence needed) and add it to the
   mail-enabled group that the Entra app's `ApplicationAccessPolicy` is scoped to; without it,
   Graph answers 403 (`ErrorAccessDenied`). Check with
   `Test-ApplicationAccessPolicy -Identity bonjour@labas.africa -AppId <client id>`.
3. In the repository:

```bash
gh variable set GRAPH_TENANT_ID --repo big-emotion/labas --body <tenant id>
gh variable set GRAPH_CLIENT_ID --repo big-emotion/labas --body <client id>
gh secret set GRAPH_CLIENT_SECRET --repo big-emotion/labas
gh variable set MAIL_SENDER --repo big-emotion/labas --body bonjour@labas.africa
openssl rand -base64 32 | gh secret set SUBSCRIBE_SECRET --repo big-emotion/labas
gh variable set NEWSLETTER --repo big-emotion/labas --body on
```

4. Deploy. CI writes the settings to `.env.subscribe` (mode 600) beside the compose file and
   starts `labas-subscribe`; Traefik routes `labas.africa/api/nouveautes*`, `/api/resultats` and `/api/compte*` to it.
   `NEWSLETTER=on` builds the sign-up blocks, the « Recevoir par e-mail » form sent by Là-bas, and the privacy sections. Unset it and redeploy to
   take them off. Changing `SUBSCRIBE_SECRET` voids the confirmation links already sent.
5. The privacy page promises an unsubscribe link in every news e-mail: whatever sends the first
   news must carry one. Addresses are erased three years after their last confirmation (the
   daily purge).

**5. Saved journeys (Postgres), when you want them on.** `labas-db` (Postgres 17) runs beside
the mail service on an internal network the proxy cannot reach. The data lives in the named volume
`labas-db`, which deploys never touch. Without a password, CI does not start it, and `/api/compte`
answers 503.

```bash
openssl rand -base64 32 | tr -d '/+=' | gh secret set LABAS_DB_PASSWORD --repo big-emotion/labas
```

The password is read only when the volume is first created: changing it later needs `ALTER USER` in
the database too. Backups: a daily `docker exec labas-db pg_dump -U labas labas | gzip` into a
directory that is copied off the server. Set it up on the host before real readers save
journeys. Why the module works this way: `docs/accounts.md`.

**6. The admin (`/admin`), when you want it on.** It needs saved journeys (step 5). The addresses
that open it are a plain variable; the Plausible key is a secret, created in Plausible under
Settings → API keys, type « Stats API ». Paste the key at the prompt, never on the command line.

```bash
gh variable set ADMIN_EMAILS --repo big-emotion/labas --body you@example.org   # comma-separated
gh secret set PLAUSIBLE_API_KEY --repo big-emotion/labas
gh variable set PLAUSIBLE_API_HOST --repo big-emotion/labas --body https://stats.ethniafrica.com
```

When Plausible runs on the same server, the service cannot reach it through the public address
(the connection times out, 2026-11-22): name it on the shared `proxy` network instead, and the
admin's link to the dashboard keeps the public address.

```bash
gh variable set PLAUSIBLE_INTERNAL_HOST --repo big-emotion/labas --body http://plausible:8000
```

`PLAUSIBLE_DOMAIN`, already set for the tracking script, names the site to the API. Without
`ADMIN_EMAILS` the page stays shut for everyone; without the key it shows the reviews and says the
figures are waiting for it.

**7. Translating reviews (DeepL), when you want it on.** It needs saved journeys (step 5), where
the reviews live. Create a key in the DeepL account (Account → API keys; a free key ends in `:fx`
and uses the free endpoint by itself), then paste it at the prompt:

```bash
gh secret set DEEPL_API_KEY --repo big-emotion/labas
```

Without the key, `POST /api/compte/reactions/:id/traduction` answers 503 and the pages show no
« Traduire » button. Only a review's text is sent to DeepL, once per review and language; the
copy is kept in `reaction_translations` and goes with the review (`docs/accounts.md`).

Once the English domain points at this server, tell the mail and accounts service with
`gh variable set EN_SITE_URL --repo big-emotion/labas --body https://overthere.africa`: it then
accepts forms from that origin and writes English links (sign-in links included) on it. Empty,
English stays under `labas.africa/en/`.

**8. First deploy.** `git tag v0.1.0 && git push origin v0.1.0`, or run the workflow by hand.
The smoke check fails the job unless `https://labas.africa/` and `https://overthere.africa/` answer 200.

## Rollback

Actions → Deploy production → Run workflow → `ref` = the last good tag. The image and the
compose file are rebuilt from that ref and the container restarts.

## Moving the domain to the hosting provider (from 2027-01-13)

`labas.africa` was registered at the current registrar on 2026-11-14; registries refuse transfers for 60 days
after registration, so the earliest date is about **2027-01-13**. No mail is used on the domain,
so the current registrar's MX, SPF and DMARC records need not be recreated.

1. Current registrar: turn off the transfer lock and get the authorisation (EPP) code.
2. Hosting provider: order the transfer of `labas.africa` with that code (paid by the operator) and choose
   its DNS zone.
3. In the new zone, before switching name servers: `@` A `<server-ip>`, `www` A `<server-ip>`.
4. Once the transfer completes and the new name servers answer, check with `dig` as in step 1.

## Second domain: overthere.africa

The English site, Over There, is built under `/en/` and served today at `labas.africa/en/…`
(addresses in `src/i18n/routes.ts`). `overthere.africa` was registered on 2026-11-19 at the current registrar
(transfer possible from about 2027-01-18). The switch is a DNS, variable and Traefik step:

- `deploy/nginx.conf` has a `server` block for `overthere.africa` and `www.overthere.africa`. It
  serves the same build and looks every address up in `/en/` first (`/city/dakar/` →
  `/en/city/dakar/index.html`), falling back to the root for the shared files (`/_astro/`, `/og/`,
  `/photos/`, icons, manifest). Old `/en/…` links there redirect to the bare address. Until a DNS
  record and a Traefik router send traffic to it, nothing reaches that block.
- The build reads `PUBLIC_EN_ORIGIN` (the `Dockerfile` argument, fed from the repository
  variable `EN_ORIGIN`). Empty, English links keep the `/en` prefix; set, they drop it, and the
  language switch links across the two domains.
- The labas.africa block carries the `/en/…` → overthere.africa 301.

Both domains then serve the same site; each opens on its own language, and the FR/EN switch on
every page links to the other domain.

### Why Traefik waited for DNS

A Traefik router asks Let's Encrypt for one certificate covering every `Host()` in its rule. Adding
`overthere.africa` to the `labas` router before the name resolves would make every order for that
certificate fail, `labas.africa`'s renewal included, and the failed validations count against
Let's Encrypt's rate limits. A separate router would keep labas.africa safe but would still retry
and fail on every request. So these labels went into `deploy/docker-compose.yml` in the switch
change (with the redirect of step 6 and the second smoke check), merged only once DNS answers.

```diff
       - "traefik.http.middlewares.labas-https.redirectscheme.permanent=true"
+      # overthere.africa — the English site, on its own router so a certificate problem on one
+      # domain never blocks the other.
+      - "traefik.http.routers.labas-en.rule=Host(`overthere.africa`) || Host(`www.overthere.africa`)"
+      - "traefik.http.routers.labas-en.entrypoints=websecure"
+      - "traefik.http.routers.labas-en.tls.certresolver=myresolver"
+      - "traefik.http.routers.labas-en.middlewares=labas-en-www"
+      - "traefik.http.middlewares.labas-en-www.redirectregex.regex=^https://www\\.overthere\\.africa/(.*)"
+      - "traefik.http.middlewares.labas-en-www.redirectregex.replacement=https://overthere.africa/$${1}"
+      - "traefik.http.middlewares.labas-en-www.redirectregex.permanent=true"
+      - "traefik.http.routers.labas-en-http.rule=Host(`overthere.africa`) || Host(`www.overthere.africa`)"
+      - "traefik.http.routers.labas-en-http.entrypoints=web"
+      - "traefik.http.routers.labas-en-http.middlewares=labas-https"
 ...
-      - "traefik.http.routers.labas-subscribe.rule=Host(`labas.africa`) && (PathPrefix(`/api/nouveautes`) || Path(`/api/resultats`) || PathPrefix(`/api/compte`))"
+      - "traefik.http.routers.labas-subscribe.rule=(Host(`labas.africa`) || Host(`overthere.africa`)) && (PathPrefix(`/api/nouveautes`) || Path(`/api/resultats`) || PathPrefix(`/api/compte`))"
```

The subscribe router needs no `www` host: `www.overthere.africa` redirects before any API call.
Adding `overthere.africa` to it changes its certificate the same way, which is why it waits too.

### Switch day, in this order

1. **Buy the domain**: done 2026-11-19.
2. **DNS**: `@` A `<server-ip>`, `www` A `<server-ip>`, delete the registrar's default AAAA. Wait
   until `dig +short overthere.africa A` and `dig +short www.overthere.africa A` both answer
   `<server-ip>`.
3. **The mail and accounts service accepts the second origin**:
   `gh variable set EN_SITE_URL --repo big-emotion/labas --body https://overthere.africa` (see
   step 7 of the one-time setup). It then accepts forms from that origin and links English
   readers there.
   **The English mailbox**: add overthere.africa to the Microsoft 365 tenant (its TXT and MX
   records), create `hello@overthere.africa` as an alias of the team mailbox, then
   `gh variable set REPLY_TO_EN --repo big-emotion/labas --body hello@overthere.africa`. English
   e-mails already go out named "Over There"; with `REPLY_TO_EN` set, readers' answers go to that
   address. English pages show it as the contact once `EN_ORIGIN` is set (step 5), not before, so
   nobody writes to an address that bounces. The sender stays `MAIL_SENDER` (labas.africa): a
   second sender would need its own Graph access policy.
4. **Traefik**: merge the switch change (the diff above, already in `deploy/docker-compose.yml`).
5. **The build variable**:
   `gh variable set EN_ORIGIN --repo big-emotion/labas --body https://overthere.africa`.
6. **The redirect**: the two `/en` lines in the labas.africa block of `deploy/nginx.conf`, in the
   same change.
7. **Release** (`/labas-release`). The first request to overthere.africa gets its certificate.
8. **Check**:
   - `curl -sI https://overthere.africa/` answers 200 and the page has `<html lang="en">`;
     `/city/dakar/` answers 200.
   - `curl -sI https://www.overthere.africa/method/` → 301 to `https://overthere.africa/method/`.
   - `curl -sI https://labas.africa/en/privacy/` → 301 to `https://overthere.africa/privacy/`.
   - `curl -sI https://overthere.africa/en/method/` → 301 to `/method/`.
   - `https://labas.africa/` still answers 200 in French, with its certificate unchanged.
   - On both domains, the FR/EN switch lands on the same page in the other language.
   - "Get it by email" works from an English page (no 403 `origin`).
   - Plausible counts visits from both hostnames (no hostname allow-list leaving out
     overthere.africa in the site settings).
   - Search engines: add overthere.africa to the search consoles, with its own sitemap.

### Social handles to reserve

Reserve « overthere.africa », or « overthereafrica » where dots are not allowed, on Instagram,
TikTok, Facebook and LinkedIn (the four networks of the `labas-social` skill), plus X and YouTube
to keep the name. Do it on purchase day: names go fast once a domain shows in public DNS. Note
what was reserved, and under which account, in the operator's private notes.
