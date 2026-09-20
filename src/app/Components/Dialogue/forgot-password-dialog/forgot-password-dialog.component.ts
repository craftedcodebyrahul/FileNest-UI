import { Component } from '@angular/core';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../Services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrl: './forgot-password-dialog.component.css'
})
export class ForgotPasswordDialogComponent {
  email = '';
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.email.trim()) return;
    this.isLoading = true;
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Password reset email sent!', 'Close', { duration: 5000 });
        this.dialogRef.close();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
