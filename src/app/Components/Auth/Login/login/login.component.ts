import { Component, inject, OnInit, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../Services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APP_MODULES } from '../../../../app.module';
import { MATERIAL_IMPORTS } from '../../../../material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from '../../../Dialogue/forgot-password-dialog/forgot-password-dialog.component';
import { environment } from '../../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('googleBtn', { static: false }) googleBtnRef!: ElementRef;

  hidePassword = true;
  isLoading = false;
  isGoogleLoading = false;

  isGisLoaded = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initGoogleIdentity();
    }
  }

  private initGoogleIdentity() {
    const checkGoogleInterval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(checkGoogleInterval);
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official button if container exists
        const btnContainer = document.getElementById('googleBtnContainer');
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            width: '100%',
            text: 'continue_with',
          });
          this.isGisLoaded = true;
        }
      }
    }, 200);

    // Timeout check to prevent infinite polling
    setTimeout(() => clearInterval(checkGoogleInterval), 6000);
  }


  triggerGooglePrompt() {
    if (isPlatformBrowser(this.platformId) && typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      this.snackBar.open('Google Sign-In is initializing or unavailable.', 'Close', { duration: 3000 });
    }
  }

  handleGoogleCredentialResponse(response: any) {
    if (response && response.credential) {
      this.isGoogleLoading = true;
      this.authService.googleLogin(response.credential).subscribe({
        next: () => {
          this.isGoogleLoading = false;
        },
        error: () => {
          this.isGoogleLoading = false;
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }
    this.isLoading = true;
    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  openForgotPasswordDialog(event: Event) {
    event.preventDefault();
    this.dialog.open(ForgotPasswordDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'custom-dialog-panel'
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

