FROM node:22-alpine AS build
WORKDIR /app
COPY Lendsqr_assessment/backend/package*.json ./
RUN npm install
COPY Lendsqr_assessment/backend ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY Lendsqr_assessment/backend/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY Lendsqr_assessment/backend/src/database/migrations ./src/database/migrations
COPY Lendsqr_assessment/backend/knexfile.ts ./
EXPOSE 4000
CMD ["npm", "start"]
