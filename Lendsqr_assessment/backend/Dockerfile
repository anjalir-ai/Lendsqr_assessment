FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install
COPY backend backend
RUN npm run build --workspace backend

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY backend/package*.json backend/
RUN npm install --omit=dev --workspace backend
COPY --from=build /app/backend/dist backend/dist
COPY backend/src/database/migrations backend/src/database/migrations
COPY backend/knexfile.ts backend/knexfile.ts
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "backend"]
