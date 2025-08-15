import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../Services/auth.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgOptimizedImage } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { APP_MODULES } from '../../../../app.module';
import { MATERIAL_IMPORTS } from '../../../../material/material.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ...APP_MODULES,...MATERIAL_IMPORTS  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  // private http = inject(HttpClient);
  hidePassword = true;

  constructor() {
 
  }

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        // successful login handled inside service (navigation/storage)
      },
      error: (error) => {
        this.snackBar.open(
          error?.error?.message || error.message || 'Login failed. Please try again.',
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
