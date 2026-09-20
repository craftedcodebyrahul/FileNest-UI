import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError, tap, catchError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { url_constants } from './url_constants';

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: any;
}

export interface UserProfile {
  id?: string;
  email: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.API_URL;
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  private getStoredUser(): UserProfile | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  setCurrentUser(user: UserProfile | null): void {
    if (user && typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}${url_constants.auth.google}`;
    return this.http.post<AuthResponse>(url, { id_token: idToken, token: idToken }).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
        if (response.user) {
          this.setCurrentUser(response.user);
        } else {
          this.fetchAndStoreProfile();
        }
        this.snackBar.open('Welcome to FileNest!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      }),
      catchError((error) =>
        this.handleError(error, 'Google Login failed. Please try again.')
      )
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const url = `${this.baseUrl}${url_constants.auth.login}`;
    return this.http.post<AuthResponse>(url, { email, password }).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
        if (response.user) {
          this.setCurrentUser(response.user);
        } else {
          this.fetchAndStoreProfile();
        }
        this.snackBar.open('Logged in successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      }),
      catchError((error) =>
        this.handleError(error, 'Login failed. Please try again.')
      )
    );
  }

  register(userForm: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.register}`;
    return this.http.post(url, userForm).pipe(
      tap(() => {
        this.snackBar.open('Registration successful! Please sign in.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      }),
      catchError((error) => this.handleError(error, 'Registration failed.'))
    );
  }

  logout(): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.logout}`;
    return this.http.post(url, {}).pipe(
      tap(() => {
        this.clearAuthSession();
      }),
      catchError(() => {
        // Even if backend logout call fails, clear client session
        this.clearAuthSession();
        return throwError(() => new Error('Logged out locally'));
      })
    );
  }

  clearAuthSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('fileExplorerCurrentPath');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  fetchAndStoreProfile(): void {
    this.getProfile().subscribe({
      next: (profile) => {
        this.setCurrentUser(profile);
      },
      error: () => {}
    });
  }

  getProfile(): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.get_profile}`;
    return this.http.get(url).pipe(
      tap((data: any) => {
        if (data) this.setCurrentUser(data);
      }),
      catchError((error) =>
        this.handleError(error, 'Failed to fetch profile.')
      )
    );
  }

  updateProfile(profileData: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.update_profile}`;
    return this.http.put(url, profileData).pipe(
      tap((data: any) => {
        if (data) this.setCurrentUser(data);
      }),
      catchError((error) => this.handleError(error, 'Update profile failed.'))
    );
  }

  changePassword(data: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.change_password}`;
    return this.http.post(url, data).pipe(
      catchError((error) =>
        this.handleError(error, 'Change password failed.')
      )
    );
  }

  forgotPassword(email: string): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.forgot_password}`;
    return this.http.post(url, { email }).pipe(
      catchError((error) =>
        this.handleError(error, 'Forgot password request failed.')
      )
    );
  }

  resetPassword(data: any): Observable<any> {
    const url = `${this.baseUrl}${url_constants.auth.reset_password}`;
    return this.http.post(url, data).pipe(
      catchError((error) => this.handleError(error, 'Reset password failed.'))
    );
  }

  me(): Observable<any> {
    const url = `${this.baseUrl}auth/me`;
    return this.http.get(url).pipe(
      catchError((error) =>
        this.handleError(error, 'Failed to fetch current user.')
      )
    );
  }

  private handleError(error: HttpErrorResponse, fallbackMessage: string) {
    const message = error.error?.detail || error.error?.message || error.message || fallbackMessage;
    this.snackBar.open(message, 'Close', { duration: 5000 });
    console.error(fallbackMessage, error);
    return throwError(() => error);
  }
}

