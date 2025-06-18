import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  constructor() {}

  /**
   * Get loading state observable
   */
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Get current loading state
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    if (loading) {
      this.requestCount++;
    } else {
      this.requestCount = Math.max(0, this.requestCount - 1);
    }
    
    this.loadingSubject.next(this.requestCount > 0);
  }

  /**
   * Force set loading state (bypass request counting)
   */
  forceSetLoading(loading: boolean): void {
    this.requestCount = loading ? 1 : 0;
    this.loadingSubject.next(loading);
  }

  /**
   * Reset loading state
   */
  reset(): void {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }
}
