import { Component } from '@angular/core';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../Services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  // Password visibility flags
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open('New passwords do not match!', 'Close', { duration: 3000 });
      return;
    }

    if (this.newPassword.length < 6) {
      this.snackBar.open('Password must be at least 6 characters long!', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.authService.changePassword({
      old_password: this.oldPassword,
      new_password: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Password changed successfully!', 'Close', { duration: 5000 });
        this.dialogRef.close();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
