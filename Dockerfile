# Là-bas — static Astro site served by nginx behind the host-level Traefik (see docs/deploy.md).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Audience measurement is baked in at build time; left empty, the site loads no script.
ARG PUBLIC_PLAUSIBLE_DOMAIN=""
ARG PUBLIC_PLAUSIBLE_HOST=""
ENV PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN \
    PUBLIC_PLAUSIBLE_HOST=$PUBLIC_PLAUSIBLE_HOST
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
