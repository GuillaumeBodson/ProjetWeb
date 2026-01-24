# ProjetWeb

A web application project with an Angular 21 frontend and .NET backend (coming soon).

## Project Structure

- **ProjetWeb.Frontend/Frontend/** - Angular 21 frontend application
- **ProjetWeb.Backend/** - .NET 9 backend API (placeholder)

## Docker Development

This project includes Docker support for containerized development and deployment.

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed

### Quick Start

Build and start all services:

```bash
docker-compose up --build
```

Run in detached mode (background):

```bash
docker-compose up -d --build
```

Stop all services:

```bash
docker-compose down
```

### Accessing the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000 (placeholder - to be implemented)

### Docker Architecture

The Docker setup includes:

- **Frontend Container**: 
  - Multi-stage build using Node.js 22 Alpine for building
  - Nginx Alpine for serving the production build
  - Configured with API proxy to backend
  - Optimized with gzip compression and asset caching

- **Backend Container**: 
  - Placeholder .NET 9 container
  - Configured to run on port 5000
  - Ready for backend implementation

- **Network**: 
  - Custom bridge network (`projetweb-network`) for inter-container communication

### Development Notes

- The frontend Dockerfile uses a multi-stage build to keep the final image small
- Nginx is configured to handle Angular routing and proxy API requests
- The backend is currently a placeholder and will be implemented with .NET 9
- Both services communicate over a shared Docker network

### Rebuilding After Changes

After making changes to the code, rebuild the containers:

```bash
docker-compose up --build
```

Or rebuild a specific service:

```bash
docker-compose build frontend
docker-compose build backend
```

## Local Development (without Docker)

For local development without Docker, refer to:
- Frontend: [ProjetWeb.Frontend/Frontend/README.md](ProjetWeb.Frontend/Frontend/README.md)
- Backend: Coming soon

## Additional Documentation

See the `Documents/` directory for project documentation and strategy documents.
