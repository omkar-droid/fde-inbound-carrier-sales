# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Start the application using docker-compose
CMD ["docker-compose", "up", "--build"]
