FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts --no-audit
COPY . .
ARG VITE_CHAIN_ID=84532
ARG VITE_RPC_URL=
ARG VITE_SEACASTER_ASSETS=
ENV VITE_CHAIN_ID=$VITE_CHAIN_ID VITE_RPC_URL=$VITE_RPC_URL VITE_SEACASTER_ASSETS=$VITE_SEACASTER_ASSETS
RUN npm run build && npm prune --omit=dev --ignore-scripts
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/backend ./backend
COPY --from=build --chown=node:node /app/game ./game
USER node
EXPOSE 3001
CMD ["node", "--experimental-strip-types", "backend/src/server.ts"]
