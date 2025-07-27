### STAGE 1: Build the Angular application ###
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
COPY frontend/package-lock.json ./
RUN npm ci --silent

COPY frontend/ .

RUN mkdir -p src/app/../../../gamelogic
COPY ./gamelogic src/app/../../../gamelogic

RUN npm install
RUN npx ng build --configuration production

# ### STAGE 2: Serve the application from NGINX ###
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

# Copy the built files from the 'builder' stage into the NGINX web root
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/project-reactenjoyerz/browser/. /usr/share/nginx/html
EXPOSE 80
