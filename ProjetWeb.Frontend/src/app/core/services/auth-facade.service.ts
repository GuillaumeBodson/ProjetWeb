import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import {AuthResponse, AuthService, LoginRequest, RegisterRequest} from '../api/auth';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthFacadeService {
  private readonly apiAuthService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  login(credentials: LoginRequest): Observable<void> {
    return new Observable(observer => {
      this.apiAuthService.apiAuthLoginPost(credentials).subscribe({
        next: (response) => {
          this.persistUserInfo(response);

          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  register(data: RegisterRequest): Observable<void> {
    return new Observable(observer => {
      this.apiAuthService.apiAuthRegisterPost(data).subscribe({
        next: (response) => {
          this.persistUserInfo(response);

          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      this.apiAuthService.apiAuthLogoutPost({ refreshToken }).subscribe({
        complete: () => {
          this.authState.clearUser();
          this.router.navigate(['/sign-in']);
        },
        error: () => {
          // Even if API call fails, clear local state
          this.authState.clearUser();
          this.router.navigate(['/sign-in']);
        }
      });
    } else {
      this.authState.clearUser();
      this.router.navigate(['/sign-in']);
    }
  }

  refreshToken(): Observable<boolean> {
    return new Observable(observer => {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.apiAuthService.apiAuthRefreshPost({ refreshToken }).subscribe({
        next: (response) => {
          this.persistUserInfo(response);
          observer.next(true);
          observer.complete();
        },
        error: () => {
          this.authState.clearUser();
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  private persistUserInfo(response: AuthResponse){
    // Store tokens
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    if (response.user) {
      this.authState.setUser(response.user);
    }
  }
}
