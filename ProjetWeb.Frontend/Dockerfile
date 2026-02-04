# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy the OpenAPI spec file first
COPY AuthService/Authentication.API.json /AuthService/Authentication.API.json

# Copy package files and install dependencies
COPY ProjetWeb.Frontend/package*.json ./
RUN npm ci

# Copy the frontend source code
COPY ProjetWeb.Frontend/ ./

# Generate auth API client and build
RUN npm run gen:auth
RUN npm run build -- --configuration=production

# Production stage
FROM nginx:alpine AS final
COPY ProjetWeb.Frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
