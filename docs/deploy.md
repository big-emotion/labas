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
   starts `labas-subscribe`; Traefik routes `labas.africa/api/nouveautes*` and `/api/resultats` to it.
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

**6. First deploy.** `git tag v0.1.0 && git push origin v0.1.0`, or run the workflow by hand.
The smoke check fails the job unless `https://labas.africa/` answers 200.

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
