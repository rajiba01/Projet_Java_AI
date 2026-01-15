# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Run stage
FROM nginx:1.25-alpine

# Angular build output is controlled by angular.json -> outputPath: dist/tunisian-economic
# This project uses the Angular browser build (static) served by Nginx.

COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy built Angular app
COPY --from=build /app/dist/tunisian-economic/ /usr/share/nginx/html