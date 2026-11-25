# Là-bas — static Astro site served by nginx behind the host-level Traefik (see docs/deploy.md).

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Audience measurement is baked in at build time; left empty, the site loads no script.
ARG PUBLIC_PLAUSIBLE_DOMAIN=""
ARG PUBLIC_PLAUSIBLE_HOST=""
# The news sign-up blocks show only once the subscribe service has its mail settings.
ARG PUBLIC_NEWSLETTER=""
# English links drop their /en prefix once overthere.africa serves them (docs/deploy.md); empty
# until the switch.
ARG PUBLIC_EN_ORIGIN=""
ENV PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN \
    PUBLIC_PLAUSIBLE_HOST=$PUBLIC_PLAUSIBLE_HOST \
    PUBLIC_NEWSLETTER=$PUBLIC_NEWSLETTER \
    PUBLIC_EN_ORIGIN=$PUBLIC_EN_ORIGIN
RUN npm run build && npm run build:server

# The mail service (src/server/subscribe.ts), bundled with the site's data into one file.
# Built with --target subscribe; the default target below stays the static site.
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS subscribe
WORKDIR /app
COPY --from=build /app/dist-server/subscribe.mjs ./
USER node
EXPOSE 8080
CMD ["node", "subscribe.mjs"]

FROM nginx:1.31-alpine@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
