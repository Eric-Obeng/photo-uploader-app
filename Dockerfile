FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/backend ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "src/index.js"]
