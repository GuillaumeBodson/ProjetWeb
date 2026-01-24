# Stage 1: Build the Angular application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the Angular app
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from build stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
