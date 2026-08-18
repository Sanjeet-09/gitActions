FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts/serve.js ./scripts/serve.js
COPY --from=build /app/package.json ./package.json

USER node

EXPOSE 3000
CMD ["node", "scripts/serve.js"]
