import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { url_constants } from './url_constants';

interface AuthResponse {
  access_token: string;
  // add other fields if backend returns them
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.API_URL;
private http= inject(HttpClient);
private router= inject(Router);
private snackBar= inject(MatSnackBar);
  constructor(
 
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}${url_constants.auth.login}`;
    return this.http.post<AuthResponse>(url, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => this.handleError(error, 'Login failed. Please try again.'))
    );
  }

  register(userForm: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.register}`;
    return this.http.post(url, userForm).pipe(
      tap(() => this.router.navigate(['/login'])),
      catchError(error => this.handleError(error, 'Registration failed.'))
    );
  }

  logout(): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.logout}`;
    return this.http.post(url, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }),
      catchError(error => this.handleError(error, 'Logout failed.'))
    );
  }

  getProfile(): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.get_profile}`;
    return this.http.get(url).pipe(
      catchError(error => this.handleError(error, 'Failed to fetch profile.'))
    );
  }

  updateProfile(profileData: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.update_profile}`;
    return this.http.put(url, profileData).pipe(
      catchError(error => this.handleError(error, 'Update profile failed.'))
    );
  }

  changePassword(data: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.change_password}`;
    return this.http.post(url, data).pipe(
      catchError(error => this.handleError(error, 'Change password failed.'))
    );
  }

  forgotPassword(email: string): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.forgot_password}`;
    return this.http.post(url, { email }).pipe(
      catchError(error => this.handleError(error, 'Forgot password request failed.'))
    );
  }

  resetPassword(data: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.reset_password}`;
    return this.http.post(url, data).pipe(
      catchError(error => this.handleError(error, 'Reset password failed.'))
    );
  }

  me(): Observable<any> {
    const url = `http://127.0.0.1:8000/me`;
    return this.http.get(url).pipe(
      catchError(error => this.handleError(error, 'Failed to fetch current user.'))
    );
  }

  private handleError(error: HttpErrorResponse, fallbackMessage: string) {
    const message =
      error.error?.message || error.message || fallbackMessage;
    this.snackBar.open(message, 'Close', { duration: 5000 });
    console.error(fallbackMessage, error);
    return throwError(() => error);
  }
}
