import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

// Global counter for active requests
let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for certain endpoints
  if (shouldSkipLoading(req.url)) {
    return next(req);
  }

  // Increment active requests and show loading
  activeRequests++;
  loadingService.setLoading(true);

  return next(req).pipe(
    finalize(() => {
      // Decrement active requests and hide loading if no more requests
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.setLoading(false);
      }
    })
  );
};

function shouldSkipLoading(url: string): boolean {
  const skipLoadingEndpoints = [
    '/api/realtime/',
    '/api/health',
    '/api/auth/refresh'
  ];

  return skipLoadingEndpoints.some(endpoint => url.includes(endpoint));
}
