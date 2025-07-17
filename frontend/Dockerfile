### STAGE 1: Build the Angular application ###
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
COPY frontend/package-lock.json ./
RUN npm ci --silent

COPY frontend/ .

RUN mkdir -p src/app/../../../gamelogic
COPY ./gamelogic src/app/../../../gamelogic

RUN npm run build

### STAGE 2: Serve the application from NGINX ###
FROM nginx:stable-alpine

# --- THIS IS THE CRITICAL MISSING STEP ---
# Copy the built files from the 'builder' stage into the NGINX web root
# NOTE: Remember to replace 'your-angular-app-name'
COPY --from=builder /app/dist/project-reactenjoyerz /usr/share/nginx/html

# Copy the custom NGINX configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80