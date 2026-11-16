# Là-bas — static Astro site served by nginx behind the host-level Traefik (see docs/deploy.md).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Audience measurement is baked in at build time; left empty, the site loads no script.
ARG PUBLIC_PLAUSIBLE_DOMAIN=""
ARG PUBLIC_PLAUSIBLE_HOST=""
# The news sign-up blocks show only once the subscribe service has its Mailjet secrets.
ARG PUBLIC_NEWSLETTER=""
ENV PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN \
    PUBLIC_PLAUSIBLE_HOST=$PUBLIC_PLAUSIBLE_HOST \
    PUBLIC_NEWSLETTER=$PUBLIC_NEWSLETTER
RUN npm run build && npm run build:server

# The mail service (src/server/subscribe.ts), bundled with the site's data into one file.
# Built with --target subscribe; the default target below stays the static site.
FROM node:24-alpine AS subscribe
WORKDIR /app
COPY --from=build /app/dist-server/subscribe.mjs ./
USER node
EXPOSE 8080
CMD ["node", "subscribe.mjs"]

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
