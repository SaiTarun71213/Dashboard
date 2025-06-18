import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = this.extractErrorMessage(error) || 'Bad Request - Invalid data provided';
              break;
            case 401:
              errorMessage = 'Unauthorized - Please login again';
              break;
            case 403:
              errorMessage = 'Forbidden - You do not have permission to perform this action';
              break;
            case 404:
              errorMessage = 'Not Found - The requested resource was not found';
              break;
            case 409:
              errorMessage = this.extractErrorMessage(error) || 'Conflict - Resource already exists';
              break;
            case 422:
              errorMessage = this.extractValidationErrors(error) || 'Validation Error - Please check your input';
              break;
            case 429:
              errorMessage = 'Too Many Requests - Please try again later';
              break;
            case 500:
              errorMessage = 'Internal Server Error - Please try again later';
              break;
            case 502:
              errorMessage = 'Bad Gateway - Server is temporarily unavailable';
              break;
            case 503:
              errorMessage = 'Service Unavailable - Server is temporarily down';
              break;
            default:
              errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
          }
        }

        // Don't show error notifications for 401 errors (handled by auth interceptor)
        if (error.status !== 401) {
          this.showErrorNotification(errorMessage);
        }

        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: errorMessage,
          error: error.error
        });

        return throwError(() => error);
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error?.error?.message) {
      return error.error.error.message;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
    return null;
  }

  private extractValidationErrors(error: HttpErrorResponse): string | null {
    if (error.error?.error?.details) {
      const details = error.error.error.details;
      if (Array.isArray(details)) {
        return details.map((detail: any) => detail.message || detail).join(', ');
      }
      if (typeof details === 'object') {
        return Object.values(details).join(', ');
      }
      return details.toString();
    }
    return this.extractErrorMessage(error);
  }

  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
