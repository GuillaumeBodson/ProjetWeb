import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { tap, map, catchError } from 'rxjs/operators';
import { AuthService, LoginRequest, RegisterRequest } from '../api/auth';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthFacadeService {
  private readonly apiAuthService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<void> {
    return this.apiAuthService.apiAuthLoginPost(credentials).pipe(
      tap(response => this.authState.setAuthData(response)),
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  register(data: RegisterRequest): Observable<void> {
    return this.apiAuthService.apiAuthRegisterPost(data).pipe(
      tap(response => this.authState.setAuthData(response)),
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  logout(): void {
    const refreshToken = this.authState.getRefreshToken();

    if (refreshToken) {
      this.apiAuthService.apiAuthLogoutPost({ refreshToken }).pipe(
        catchError(() => {
          // Even if API call fails, continue with cleanup
          return throwError(() => new Error('Logout API failed'));
        })
      ).subscribe({
        next: () => this.performLogoutCleanup(),
        error: () => this.performLogoutCleanup()
      });
    } else {
      this.performLogoutCleanup();
    }
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = this.authState.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available')).pipe(
        catchError(() => this.handleRefreshFailure())
      );
    }

    return this.apiAuthService.apiAuthRefreshPost({ refreshToken }).pipe(
      tap(response => this.authState.setAuthData(response)),
      map(() => true),
      catchError(() => this.handleRefreshFailure())
    );
  }

  private performLogoutCleanup(): void {
    this.authState.clearUser();
    this.router.navigate(['/sign-in']);
  }

  private handleRefreshFailure(): Observable<boolean> {
    this.authState.clearUser();
    return throwError(() => false).pipe(
      catchError(() => {
        return [false];
      })
    );
  }
}
