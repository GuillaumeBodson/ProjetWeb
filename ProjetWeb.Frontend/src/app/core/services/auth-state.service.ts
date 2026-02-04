import {Injectable, signal, computed, effect, inject} from '@angular/core';
import { Router } from '@angular/router';
import {UserDto} from '../api/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly router = inject(Router);

  // Private writable signal
  private readonly userSignal = signal<UserDto | null>(null);

  // Public readonly signals
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly userRole = computed(() => this.user()?.role);

  constructor() {
    // Load user from localStorage on service initialization
    this.loadUserFromStorage();

    // Optional: Auto-save to localStorage when user changes
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        localStorage.setItem('auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('auth_user');
      }
    });
  }

  setUser(user: UserDto): void {
    this.userSignal.set(user);
  }

  clearUser(): void {
    this.userSignal.set(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token'); // If you store token separately
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

  logout(): void {
    this.clearUser();
    this.router.navigate(['/sign-in']);
  }
}
