# Base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev

# Copy application source code
COPY . .

# Expose server port
EXPOSE 8080

# Start server
CMD ["node", "app.js"]
