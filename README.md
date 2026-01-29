# ProjetWeb

A web application project with an Angular 21 frontend and .NET 10 backend, orchestrated using .NET Aspire.

## Project Structure

- **ProjetWeb.AppHost/** - .NET Aspire AppHost for orchestration
- **ProjetWeb.Api/** - .NET 10 backend API
- **ProjetWeb.Frontend/** - Angular 21 frontend application
- **ProjetWeb.ServiceDefaults/** - Shared service defaults

## Running with Docker (Recommended)

This project uses .NET Aspire AppHost to orchestrate all services from a single Docker container. The AppHost manages both the API and Frontend services, providing an integrated development experience with the Aspire Dashboard for observability.

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed

### Quick Start

Build and start the AppHost with all services:

```bash
docker-compose up --build
```

View logs from the AppHost:

```bash
docker-compose logs -f apphost
```

Stop all services:

```bash
docker-compose down
```

### Accessing the Application

- **Aspire Dashboard**: http://localhost:15888 - Monitor all services, view logs, traces, and metrics
- **API Backend**: http://localhost:5000 - .NET 10 REST API
- **Angular Frontend**: http://localhost:4200 - Angular 21 web application

### Docker Architecture

The Docker setup uses .NET Aspire AppHost to orchestrate services:

- **AppHost Container**:
  - Uses .NET 10 SDK with Docker CLI support
  - Includes Node.js 20.x LTS for Angular frontend
  - Mounts Docker socket for container management (Docker-in-Docker)
  - Provides hot reload for development
  - Orchestrates API and Frontend containers
  - Exposes Aspire Dashboard for observability

**⚠️ Security Warning**: This setup mounts the Docker socket (`/var/run/docker.sock`), which grants the container full access to the Docker daemon. This poses significant security risks including:
- Potential container breakout to the host system
- Access to all containers on the host
- Ability to mount any host directory
- Full Docker daemon privileges

**This configuration is ONLY intended for development environments. NEVER use this in production.**

For production deployments, consider:
- Using rootless Docker
- Implementing proper container isolation
- Using Kubernetes or other orchestration platforms with proper security boundaries
- Review [Docker security best practices](https://docs.docker.com/engine/security/)

### Development Features

- **Hot Reload**: Code changes are automatically detected and applied
- **Aspire Dashboard**: Real-time monitoring of services, traces, and logs
- **Integrated Orchestration**: All services managed by a single AppHost
- **Docker-in-Docker**: AppHost creates and manages service containers dynamically

## Local Development (without Docker)

For local development without Docker, refer to:
- Frontend: [ProjetWeb.Frontend/README.md](ProjetWeb.Frontend/README.md)
- Backend: Run the AppHost directly with `dotnet run` in ProjetWeb.AppHost directory

## Additional Documentation

See the `Documents/` directory for project documentation and strategy documents.
