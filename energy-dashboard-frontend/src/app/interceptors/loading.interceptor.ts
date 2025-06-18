import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading indicator for certain endpoints
    if (this.shouldSkipLoading(req.url)) {
      return next.handle(req);
    }

    // Increment active requests and show loading
    this.activeRequests++;
    this.loadingService.setLoading(true);

    return next.handle(req).pipe(
      finalize(() => {
        // Decrement active requests and hide loading if no more requests
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.loadingService.setLoading(false);
        }
      })
    );
  }

  private shouldSkipLoading(url: string): boolean {
    const skipLoadingEndpoints = [
      '/api/realtime/',
      '/api/health',
      '/api/auth/refresh'
    ];
    
    return skipLoadingEndpoints.some(endpoint => url.includes(endpoint));
  }
}
