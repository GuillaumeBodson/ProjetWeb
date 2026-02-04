import {Component, inject, signal, ChangeDetectionStrategy, DestroyRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {AuthFacadeService} from '../../../../core/services/auth-facade.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent {
  private readonly authFacade = inject(AuthFacadeService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);


  readonly signInForm: FormGroup<{email: FormControl , password: FormControl}> = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly hidePassword = signal(true);

  onSubmit(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const {email, password} = this.signInForm.value;

    this.authFacade.login({email, password})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Authentication failed. Please try again.');
          this.isLoading.set(false);
        }
      });
  }


  getErrorMessage(field: string): string {
    const control = this.signInForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (control.hasError('email')) return 'Invalid email format';
    if (control.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }
}
