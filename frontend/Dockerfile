# ------------------------------------------------------------------------------
# Frontend image — Vite build served by nginx.
#
# The API URL is a build-time constant in Vite, so it is passed as a build arg.
# The default, `/api`, is proxied by nginx to the backend service, which means
# the shipped image works with no configuration and the browser never has to
# know a second hostname.
# ------------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ------------------------------------------------------------------------------

FROM nginx:1.27-alpine AS final

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
