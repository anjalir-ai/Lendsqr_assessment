FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY src/database/migrations ./src/database/migrations
COPY src/config/knexfile.ts ./src/config/knexfile.ts
EXPOSE 4000
CMD ["npm", "start"]
