# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Production stage
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]