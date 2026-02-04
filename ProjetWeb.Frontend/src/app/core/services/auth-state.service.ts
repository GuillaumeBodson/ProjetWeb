import {Injectable, signal, computed, effect, inject} from '@angular/core';
import { Router } from '@angular/router';
import {AuthResponse, UserDto} from '../api/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly router = inject(Router);
  private readonly userSignal = signal<UserDto | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly userRole = computed(() => this.user()?.role);

  constructor() {
    this.loadUserFromStorage();
  }

  setAuthData(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    if (response.user) {
      this.userSignal.set(response.user);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    }
  }

  clearUser(): void {
    this.userSignal.set(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        this.userSignal.set(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }
}
