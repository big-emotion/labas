# Là-bas — static Astro site served by nginx behind the host-level Traefik (see docs/deploy.md).

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
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
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS subscribe
WORKDIR /app
COPY --from=build /app/dist-server/subscribe.mjs ./
USER node
EXPOSE 8080
CMD ["node", "subscribe.mjs"]

FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
