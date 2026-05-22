import { Component, inject } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [...MATERIAL_IMPORTS, ...APP_MODULES],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  hidePassword = true;
  isLoading = false;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  form = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    phone_number: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  onSignup() {
    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }
    this.isLoading = true;
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Account created! Please sign in.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.detail || err?.error?.message || 'Registration failed. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  private markAllTouched() {
    Object.values(this.form.controls).forEach(c => c.markAsTouched());
  }
}
