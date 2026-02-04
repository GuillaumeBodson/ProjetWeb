# TypeScript Client Generation

## Overview

This project uses [OpenAPI Generator](https://openapi-generator.tech/) to automatically generate type-safe TypeScript API clients from .NET backend OpenAPI specifications.

**Flow:** `.NET Backend` → `OpenAPI JSON` → `Generator` → `Angular TypeScript Client`

## Quick Start

```bash
# Generate auth client
npm run gen:auth

# Location
src/app/core/api/auth/

# Import
import { AuthService, LoginRequest } from '@/core/api/auth';
```

## Configuration

### Generator Version

Set in `openapitools.json`:
```json
{
  "generator-cli": {
    "version": "7.19.0"
  }
}
```

### Generation Script

In `package.json`:
```json
{
  "scripts": {
    "gen:auth": "openapi-generator-cli generate -i ../AuthService/Authentication.API.json -g typescript-angular -o src/app/core/api/auth --additional-properties=fileNaming=kebab-case,serviceSuffix=Service,useHttpClient=true,standalone=true"
  }
}
```

**Parameters:**
- `-i`: Input OpenAPI spec file
- `-g`: Generator (typescript-angular)
- `-o`: Output directory
- `fileNaming=kebab-case`: File naming style
- `serviceSuffix=Service`: Add "Service" suffix
- `useHttpClient=true`: Use Angular HttpClient
- `standalone=true`: Angular 21 standalone mode

## Generated Structure

```
src/app/core/api/auth/
├── api/
│   └── auth.service.ts      # HTTP service methods
├── model/
│   ├── login-request.ts     # Request/response types
│   ├── auth-response.ts
│   └── ...
├── configuration.ts         # API config (base URL, etc.)
└── index.ts                # Barrel exports
```

## Usage

### Basic Example

```typescript
import { Component, inject } from '@angular/core';
import { AuthService, LoginRequest } from '@/core/api/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `...`
})
export class LoginComponent {
  private authService = inject(AuthService);

  login(email: string, password: string): void {
    this.authService.apiAuthLoginPost({ email, password }).subscribe({
      next: (response) => console.log('Token:', response.token),
      error: (error) => console.error('Login failed:', error)
    });
  }
}
```

### Configure Base URL

```typescript
// app.config.ts
import { Configuration } from '@/core/api/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideApi('https://localhost:7001')
  ]
};
```

### Add Auth Interceptor

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))
```

## Workflow

### When to Regenerate
- Backend API endpoints change
- Request/response models change
- After pulling backend updates

### Process
1. Update backend API
2. Ensure OpenAPI spec is exported: `AuthService/Authentication.API.json`
3. Run: `npm run gen:auth`
4. Review: `git diff src/app/core/api/auth/`
5. Update frontend if breaking changes
6. Test

### Preserve Custom Files

Add to `.openapi-generator-ignore`:
```
configuration.ts
api.base.service.ts
```

## Adding New Services

```json
// package.json
{
  "scripts": {
    "gen:auth": "openapi-generator-cli generate -i ../AuthService/Authentication.API.json -g typescript-angular -o src/app/core/api/auth --additional-properties=fileNaming=kebab-case,serviceSuffix=Service,useHttpClient=true,standalone=true",
    "gen:orders": "openapi-generator-cli generate -i ../OrderService/Orders.API.json -g typescript-angular -o src/app/core/api/orders --additional-properties=fileNaming=kebab-case,serviceSuffix=Service,useHttpClient=true,standalone=true"
  }
}
```

## Best Practices

✅ Commit all generated files to track API changes  
✅ Never manually edit generated files  
✅ Use `.openapi-generator-ignore` for customizations  
✅ Test after regeneration 

---

**Generator:** OpenAPI Generator 7.19.0  
**Angular:** 21.0.0  
