# Web de Turnos Respiratoria: se compila con Vite y se sirve con Nginx (sin privilegios), que además reenvía /api a la API.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
# `npm run build` revisa los tipos y compila
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
