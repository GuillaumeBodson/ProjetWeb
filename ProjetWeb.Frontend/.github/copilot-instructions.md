# Copilot Instructions for ProjetWeb

## Project Overview
This is an Angular 21 project using TypeScript, Tailwind CSS, and Angular Material components. Follow these guidelines when generating code.

## Core Principles

### SOLID Principles
- **Single Responsibility Principle (SRP)**: Each class, component, or service should have only one reason to change. Keep components focused on presentation logic and delegate business logic to services.
- **Open/Closed Principle (OCP)**: Design components and services to be open for extension but closed for modification. Use inheritance, composition, and dependency injection.
- **Liskov Substitution Principle (LSP)**: Derived classes must be substitutable for their base classes. Ensure interfaces and abstract classes are properly implemented.
- **Interface Segregation Principle (ISP)**: Create small, focused interfaces rather than large, monolithic ones. Components should not depend on interfaces they don't use.
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions. Use Angular's dependency injection to inject services via interfaces or abstract classes.

## Angular 21 Best Practices

### Project Structure
```
src/
├── app/
│   ├── core/                 # Singleton services, guards, interceptors
│   ├── shared/               # Shared components, directives, pipes
│   ├── features/             # Feature modules
│   │   └── feature-name/
│   │       ├── components/
│   │       ├── services/
│   │       ├── models/
│   │       └── feature-name.routes.ts
│   └── layout/               # Layout components
```

### Components
- Use **standalone components** by default (Angular 21 standard)
- Implement `OnPush` change detection strategy for better performance
- Keep component logic minimal; delegate to services
- Use `signal()` for reactive state management instead of traditional RxJS where appropriate
- Prefer `@Input()` and `@Output()` with explicit types
- Use Angular's new control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <mat-spinner></mat-spinner>
    } @else {
      @for (item of items(); track item.id) {
        <div>{{ item.name }}</div>
      }
    }
  `
})
export class ExampleComponent {
  isLoading = signal(false);
  items = signal<Item[]>([]);
}
```

### Services
- Create services in the `core/` directory for singleton services
- Use `providedIn: 'root'` for application-wide services
- Keep services focused on a single responsibility
- Use dependency injection for all service dependencies
- Implement proper error handling

```typescript
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly data = signal<Data[]>([]);
  
  readonly data$ = this.data.asReadonly();
  
  loadData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data').pipe(
      tap(data => this.data.set(data)),
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong'));
  }
}
```

### Routing
- Use standalone routing with route configuration
- Implement lazy loading for feature modules
- Use route guards for authentication and authorization
- Leverage `inject()` function in functional guards

```typescript
export const routes: Routes = [
  {
    path: 'feature',
    loadComponent: () => import('./features/feature/feature.component'),
    canActivate: [authGuard]
  }
];

// Functional guard
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
```

### State Management
- Use `signal()` for local component state
- Use `computed()` for derived state
- Use `effect()` sparingly for side effects
- Consider RxJS for complex async operations

```typescript
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  
  products = signal<Product[]>([]);
  searchTerm = signal('');
  
  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(term)
    );
  });
}
```

## Tailwind CSS - Mobile-First Approach

### Core Principles
- Always design for mobile first, then enhance for larger screens
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

### Best Practices
```html
<!-- Mobile-first example -->
<div class="flex flex-col md:flex-row gap-4 p-4 md:p-6 lg:p-8">
  <div class="w-full md:w-1/2 lg:w-1/3">
    <h2 class="text-lg md:text-xl lg:text-2xl">Title</h2>
    <p class="text-sm md:text-base">Description</p>
  </div>
</div>

<!-- Mobile menu example -->
<nav class="fixed bottom-0 w-full md:relative md:w-auto">
  <ul class="flex justify-around md:justify-start md:gap-4">
    <li class="p-2">Link</li>
  </ul>
</nav>
```

### Layout Patterns
- Use `flex` and `grid` for responsive layouts
- Stack elements vertically on mobile, horizontally on desktop
- Hide elements on mobile: `hidden md:block`
- Show only on mobile: `md:hidden`

```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Grid items -->
</div>

<!-- Responsive padding/margin -->
<section class="px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
  <!-- Content -->
</section>
```

## Angular Material Components

### Component Usage
- Always import Material modules explicitly in standalone components
- Use Material components consistently across the application
- Follow Material Design guidelines for UX patterns

### Common Components

#### Buttons
```typescript
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button mat-raised-button color="primary">Primary</button>
    <button mat-stroked-button>Secondary</button>
    <button mat-icon-button><mat-icon>menu</mat-icon></button>
  `
})
```

#### Forms
```typescript
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <mat-form-field class="w-full">
      <mat-label>Email</mat-label>
      <input matInput type="email" [formControl]="emailControl">
      @if (emailControl.hasError('email')) {
        <mat-error>Please enter a valid email</mat-error>
      }
    </mat-form-field>
  `
})
export class FormComponent {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
}
```

#### Dialogs
```typescript
import { MatDialogModule } from '@angular/material/dialog';

export class MyComponent {
  private dialog = inject(MatDialog);
  
  openDialog(): void {
    this.dialog.open(MyDialogComponent, {
      width: '400px',
      data: { /* data to pass */ }
    });
  }
}
```

#### Tables
```typescript
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule],
  template: `
    <table mat-table class="w-full" matSort>
      <thead>
        <tr mat-header-row>
          <th mat-header-cell mat-sort-header>Name</th>
        </tr>
      </thead>
      <tbody>
        @for (element of dataSource(); track element.id) {
          <tr mat-row>
            <td mat-cell>{{ element.name }}</td>
          </tr>
        }
      </tbody>
    </table>
    <mat-paginator [pageSizeOptions]="[5, 10, 20]"></mat-paginator>
  `
})
```

### Combining Material with Tailwind
- Use Material components for UI widgets
- Use Tailwind for layout, spacing, and responsive design
- Apply Tailwind classes to Material component wrappers

```html
<mat-card class="max-w-md mx-auto mt-8 p-6">
  <mat-card-header class="mb-4">
    <mat-card-title class="text-2xl">Title</mat-card-title>
  </mat-card-header>
  <mat-card-content class="space-y-4">
    <!-- Content -->
  </mat-card-content>
  <mat-card-actions class="flex justify-end gap-2 mt-4">
    <button mat-button>Cancel</button>
    <button mat-raised-button color="primary">Save</button>
  </mat-card-actions>
</mat-card>
```

## TypeScript Best Practices

### Type Safety
- Always use explicit types for function parameters and return values
- Avoid using `any`; prefer `unknown` if type is truly unknown
- Use interfaces for object shapes
- Use type aliases for union types or complex types

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Observable<User> {
  return this.http.get<User>(`/api/users/${id}`);
}

// Bad
function getUser(id): any {
  return this.http.get(`/api/users/${id}`);
}
```

### Modern TypeScript Features
- Use optional chaining: `user?.profile?.email`
- Use nullish coalescing: `value ?? defaultValue`
- Use template literals for string concatenation
- Use destructuring for cleaner code

```typescript
const { id, name, email } = user;
const displayName = user?.profile?.displayName ?? user.name;
```

## Testing

### Component Testing
- Use Angular Testing Library or Vitest for component tests
- Test component behavior, not implementation details
- Mock services using dependency injection

```typescript
describe('MyComponent', () => {
  it('should display user name', async () => {
    const mockService = { getUser: () => of({ name: 'John' }) };
    await render(MyComponent, {
      providers: [
        { provide: UserService, useValue: mockService }
      ]
    });
    expect(screen.getByText('John')).toBeTruthy();
  });
});
```

### Service Testing
- Test services in isolation
- Mock HTTP calls using HttpClientTestingModule
- Test error handling

## Accessibility

### ARIA and Semantic HTML
- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`)
- Add ARIA labels where necessary
- Ensure keyboard navigation works
- Material components include built-in accessibility features

```html
<button mat-button aria-label="Close dialog" (click)="close()">
  <mat-icon>close</mat-icon>
</button>
```

## Performance

### Optimization Strategies
- Use `OnPush` change detection
- Use `trackBy` functions in `@for` loops
- Lazy load routes and modules
- Use `async` pipe or signals to handle subscriptions
- Avoid unnecessary re-renders

```typescript
@for (item of items(); track item.id) {
  <app-item [data]="item"></app-item>
}
```

## Code Style

### Naming Conventions
- Components: PascalCase with Component suffix (e.g., `UserProfileComponent`)
- Services: PascalCase with Service suffix (e.g., `AuthService`)
- Interfaces: PascalCase (e.g., `User`, `AuthConfig`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Variables/functions: camelCase (e.g., `userName`, `getUserData`)

### File Organization
- One component/service per file
- Co-locate related files in feature directories
- Use index.ts for barrel exports when appropriate

### Comments
- Write self-documenting code
- Add JSDoc comments for public APIs
- Explain "why" not "what" in comments

```typescript
/**
 * Validates user permissions for accessing protected resources.
 * @param user - The authenticated user object
 * @param resource - The resource being accessed
 * @returns true if user has permission, false otherwise
 */
function hasPermission(user: User, resource: Resource): boolean {
  // Implementation
}
```

## Summary
When generating code for this project:
1. Follow SOLID principles strictly
2. Use Angular 21 features (standalone, signals, new control flow)
3. Design mobile-first with Tailwind CSS
4. Use Angular Material components consistently
5. Ensure type safety with TypeScript
6. Write testable, maintainable code
7. Prioritize performance and accessibility
