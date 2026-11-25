FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/src ./src
COPY --from=builder /app/vite.config.js ./vite.config.js

EXPOSE 3000
CMD ["node", "--import", "./src/backend/tracing.js", "src/backend/server.js"]
