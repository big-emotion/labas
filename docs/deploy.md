# Deploy — labas.africa on the OVH VPS

How Là-bas goes live, ships and rolls back. Same host and conventions as `ethniafrica.com` and
`big-emotion.com`, so nothing here is new infrastructure.

## The host

|               |                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| VPS           | `vps-ef296ed8.vps.ovh.net`, IPv4 `51.195.82.98` (the application host)             |
| Login         | `ubuntu` on the host's non-default SSH port (in the operator's private notes)      |
| Reverse proxy | Traefik, own compose project, ACME resolver `myresolver`, external network `proxy` |
| App directory | `/home/ubuntu/labas/` — only `docker-compose.yml`; CI ships it with each deploy    |
| Container     | `labas`, image `labas:live`: nginx serving the static Astro build                  |

The VPS never builds: CI builds the image (`Dockerfile`), ships it as a tarball and restarts the
container (`.github/workflows/deploy-production.yml`).

## What deploys

```
git push origin main        → CI only.
git tag v0.1.0 && git push origin v0.1.0  → deploy-production.yml → https://labas.africa
Actions → Deploy production → Run workflow (ref)  → redeploy or roll back to that ref
```

## One-time setup (in this order)

**1. DNS first.** Traefik asks Let's Encrypt for a certificate on the first request; if the name
does not resolve to the VPS yet, every retry fails and rate limits follow. Until the domain moves
to OVH (below), the zone is at IONOS:

| Name                 | Type | Value                                                                     |
| -------------------- | ---- | ------------------------------------------------------------------------- |
| `labas.africa` (`@`) | A    | `51.195.82.98`                                                            |
| `www`                | A    | `51.195.82.98`                                                            |
| `@`                  | AAAA | delete (IONOS's default); the other sites on this VPS have no IPv6 record |

Check: `dig +short labas.africa A` and `dig +short www.labas.africa A` both answer `51.195.82.98`.

**2. The app directory on the VPS.**

```bash
ssh -p <port> ubuntu@51.195.82.98 'mkdir -p ~/labas'
```

**3. A dedicated deploy key and the repository settings.**

```bash
ssh-keygen -t ed25519 -f ./labas_deploy -N "" -C "github-actions-deploy@labas"
ssh-copy-id -i ./labas_deploy.pub -p <port> ubuntu@51.195.82.98
gh secret set DEPLOY_SSH_KEY --repo big-emotion/labas < ./labas_deploy
gh variable set DEPLOY_HOST --repo big-emotion/labas --body 51.195.82.98
gh variable set DEPLOY_PORT --repo big-emotion/labas --body <port>
gh variable set DEPLOY_USER --repo big-emotion/labas --body ubuntu
gh variable set DEPLOY_KNOWN_HOSTS --repo big-emotion/labas --body "$(ssh-keyscan -p <port> 51.195.82.98 2>/dev/null)"
rm -f ./labas_deploy ./labas_deploy.pub
```

Optional, once the site is added in Plausible: `gh variable set PLAUSIBLE_DOMAIN --body labas.africa`
(and `PLAUSIBLE_HOST` only if the collector is not `https://stats.big-emotion.com`).

**4. First deploy.** `git tag v0.1.0 && git push origin v0.1.0`, or run the workflow by hand.
The smoke check fails the job unless `https://labas.africa/` answers 200.

## Rollback

Actions → Deploy production → Run workflow → `ref` = the last good tag. The image and the
compose file are rebuilt from that ref and the container restarts.

## Moving the domain to OVH (from 2027-01-13)

`labas.africa` was registered at IONOS on 2026-11-14; registries refuse transfers for 60 days
after registration, so the earliest date is about **2027-01-13**. No mail is used on the domain,
so the IONOS MX, SPF and DMARC records need not be recreated.

1. IONOS: turn off the transfer lock and get the authorisation (EPP) code.
2. OVH: order the transfer of `labas.africa` with that code (paid by the operator) and choose
   the OVH DNS zone.
3. In the OVH zone, before switching name servers: `@` A `51.195.82.98`, `www` A `51.195.82.98`.
4. Once the transfer completes and the OVH name servers answer, check with `dig` as in step 1.
