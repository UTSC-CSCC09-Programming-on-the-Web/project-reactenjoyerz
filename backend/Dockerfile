# Base image
FROM node:20

# Create app directory
WORKDIR /app

# Install app dependencies
COPY ./backend/package*.json ./
RUN npm install

# Copy the rest of the app
COPY ./backend .

RUN mkdir -p /gamelogic
COPY ./gamelogic /gamelogic

# Set environment variables if needed
# ENV NODE_ENV=production

# Expose port your app runs on (adjust if not 3000)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]