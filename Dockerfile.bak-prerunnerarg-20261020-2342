FROM node:18-alpine AS builder
WORKDIR /app
ARG PROOF_BASE_PATH=/proof/screen
ARG PROOF_BOOKING_URL=
ENV PROOF_BASE_PATH=${PROOF_BASE_PATH} PROOF_BOOKING_URL=${PROOF_BOOKING_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PROOF_BASE_PATH=/proof/screen
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "start"]
