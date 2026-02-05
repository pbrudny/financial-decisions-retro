FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:shared
RUN npx vite build --config client/vite.config.ts client/

FROM node:22-slim AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/shared/dist ./shared/dist
COPY shared/package.json shared/
COPY server/package.json server/
COPY server/src ./server/src
COPY --from=build /app/client/dist ./client/dist
COPY package.json .

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/retro.db
ENV CLIENT_DIST=/app/client/dist

EXPOSE 3000

CMD ["npx", "tsx", "server/src/app.ts"]
