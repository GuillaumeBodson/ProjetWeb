# Stage 1: Build the Angular application
FROM dhi.io/node:24-alpine3.22-dev AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install the required npm version and dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy application source
COPY . .

# Build the Angular app
RUN npm run build




# # Stage 2: Serve the application with Nginx
FROM dhi.io/nginx:1.28.0-alpine3.21-dev AS runner

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --chown=nginx:nginx --from=builder /app/dist/*/browser /usr/share/nginx/html



# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
