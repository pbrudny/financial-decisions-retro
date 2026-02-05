FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build:shared
RUN npx vite build --config client/vite.config.ts client/

FROM node:22-slim AS production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
RUN npm ci --omit=dev
COPY --from=build /app/shared/dist ./shared/dist
COPY server/src ./server/src
COPY --from=build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/retro.db
ENV CLIENT_DIST=/app/client/dist

EXPOSE 3000

CMD ["npx", "tsx", "server/src/app.ts"]
