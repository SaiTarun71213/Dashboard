import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Global state for token refresh
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip authentication for login and public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Add auth token to request
  const authReq = addTokenHeader(req, authService.getAccessToken());

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicEndpoint(req.url)) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function isPublicEndpoint(url: string): boolean {
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/health'
  ];

  return publicEndpoints.some(endpoint => url.includes(endpoint));
}

function addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
  if (token) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  return request;
}

function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap((response: any) => {
          isRefreshing = false;

          if (response.success && response.data.tokens) {
            authService.setTokens(
              response.data.tokens.accessToken,
              response.data.tokens.refreshToken
            );
            refreshTokenSubject.next(response.data.tokens.accessToken);

            return next(addTokenHeader(request, response.data.tokens.accessToken));
          }

          // Refresh failed, logout user
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError((error) => {
          isRefreshing = false;
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    } else {
      // No refresh token, logout user
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => new Error('No refresh token available'));
    }
  }

  // If already refreshing, wait for the new token
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => next(addTokenHeader(request, token)))
  );
}
