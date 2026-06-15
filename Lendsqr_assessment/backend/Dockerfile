FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY backend/src/database/migrations ./src/database/migrations
COPY backend/knexfile.ts ./
EXPOSE 4000
CMD ["npm", "start"]
