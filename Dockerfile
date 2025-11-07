# Use an official Node.js runtime as base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production --silent

# Copy the rest of your backend files
COPY . .

# Expose backend port (same as in your .env)
EXPOSE 4000

# Set environment variables (optional override)
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
