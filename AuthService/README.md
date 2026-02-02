# Authentication Service

## Configuration

### JWT Secret Configuration

For security reasons, the JWT signing key is not included in `appsettings.json`. You must configure it using one of the following methods:

#### Development - User Secrets (Recommended)

```bash
cd AuthService
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "your-super-secret-key-at-least-32-characters-long!"
```

#### Production - Environment Variables

Set the following environment variable:

```bash
export Jwt__Key="your-super-secret-key-at-least-32-characters-long!"
```

Or in Docker/Kubernetes:

```yaml
environment:
  - Jwt__Key=your-super-secret-key-at-least-32-characters-long!
```

#### Docker Compose

Add to your `docker-compose.yaml`:

```yaml
services:
  authservice:
    environment:
      Jwt__Key: "your-super-secret-key-at-least-32-characters-long!"
```

### Important Notes

- The JWT key must be at least 32 characters long
- Use a strong, randomly generated key in production
- Never commit secrets to source control
- The same key must be configured in both `AuthService` and `ApiGateway`
