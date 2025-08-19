import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../Services/auth.service';
import { of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    if (token) {
      return authService.getProfile().pipe(
        map((data) => {
          localStorage.setItem('user', JSON.stringify(data));
          return true; // allow route
        }),
        catchError(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          return of(router.createUrlTree(['/login'])); // redirect to login
        })
      );
    }
  }

  // no token or not browser
  return router.createUrlTree(['/login']);
};
