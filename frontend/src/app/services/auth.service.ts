import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService, User, LoginCredentials } from './api.service';
import { WebSocketService } from './websocket.service';

/**
 * AUTHENTICATION SERVICE
 * Handles user authentication, authorization, and session management
 * Integrates with API service and WebSocket service
 */

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();
  public isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public currentUser$ = this.authState$.pipe(map(state => state.user));
  public isLoading$ = this.authState$.pipe(map(state => state.loading));
  public authError$ = this.authState$.pipe(map(state => state.error));

  constructor(
    private apiService: ApiService,
    private webSocketService: WebSocketService
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  private initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.setLoading(true);
      this.validateToken();
    }
  }

  /**
   * Validate stored token
   */
  private validateToken(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.setAuthenticatedUser(response.data);
          this.authenticateWebSocket();
        } else {
          this.clearAuth();
        }
        this.setLoading(false);
      },
      error: (error) => {
        console.error('Token validation failed:', error);
        this.clearAuth();
        this.setLoading(false);
      }
    });
  }

  /**
   * Login user
   */
  login(credentials: LoginCredentials): Observable<boolean> {
    this.setLoading(true);
    this.clearError();

    return this.apiService.login(credentials).pipe(
      tap({
        next: (response) => {
          if (response.success && response.data) {
            this.setAuthenticatedUser(response.data.user);
            this.authenticateWebSocket();
          } else {
            this.setError(response.message || 'Login failed');
          }
          this.setLoading(false);
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.setError(errorMessage);
          this.setLoading(false);
        }
      }),
      map(response => response.success)
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.apiService.logout();
    this.webSocketService.disconnect();
    this.clearAuth();
  }

  /**
   * Get access token for interceptors
   */
  getAccessToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Get refresh token for interceptors
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Set tokens (used by interceptor)
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.apiService.refreshToken(refreshToken);
  }

  /**
   * Get current user (for interceptors)
   */
  getCurrentUser(): User | null {
    const currentState = this.authStateSubject.value;
    return currentState.user;
  }

  /**
   * Set authenticated user
   */
  private setAuthenticatedUser(user: User): void {
    this.updateAuthState({
      isAuthenticated: true,
      user,
      loading: false,
      error: null
    });
  }

  /**
   * Clear authentication
   */
  private clearAuth(): void {
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    const currentState = this.authStateSubject.value;
    this.updateAuthState({ ...currentState, loading });
  }

  /**
   * Set error state
   */
  private setError(error: string): void {
    const currentState = this.authStateSubject.value;
    this.updateAuthState({ ...currentState, error });
  }

  /**
   * Clear error state
   */
  private clearError(): void {
    const currentState = this.authStateSubject.value;
    this.updateAuthState({ ...currentState, error: null });
  }

  /**
   * Update auth state
   */
  private updateAuthState(newState: AuthState): void {
    this.authStateSubject.next(newState);
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticateWebSocket(): void {
    const token = localStorage.getItem('authToken');
    if (token && this.webSocketService.isConnected()) {
      this.webSocketService.authenticate(token);
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.authStateSubject.value.user;
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.authStateSubject.value.user;
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.authStateSubject.value.user;
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user can access admin features
   */
  isAdmin(): boolean {
    return this.hasAnyRole(['Super Admin', 'Admin']);
  }

  /**
   * Check if user can manage plants
   */
  canManagePlants(): boolean {
    return this.hasAnyRole(['Super Admin', 'Admin', 'Plant Manager']);
  }

  /**
   * Check if user can operate equipment
   */
  canOperateEquipment(): boolean {
    return this.hasAnyRole(['Super Admin', 'Admin', 'Plant Manager', 'Operator']);
  }

  /**
   * Check if user can view data
   */
  canViewData(): boolean {
    return this.hasAnyRole(['Super Admin', 'Admin', 'Plant Manager', 'Operator', 'Viewer']);
  }


  /**
   * Get current user role
   */
  getCurrentUserRole(): string | null {
    return this.authStateSubject.value.user?.role || null;
  }

  /**
   * Get current user permissions
   */
  getCurrentUserPermissions(): string[] {
    return this.authStateSubject.value.user?.permissions || [];
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Check if currently loading
   */
  isLoading(): boolean {
    return this.authStateSubject.value.loading;
  }

  /**
   * Get current error
   */
  getError(): string | null {
    return this.authStateSubject.value.error;
  }

  /**
   * Refresh user data
   */
  refreshUser(): Observable<User | null> {
    return this.apiService.getCurrentUser().pipe(
      tap({
        next: (response) => {
          if (response.success && response.data) {
            this.setAuthenticatedUser(response.data);
          }
        },
        error: (error) => {
          console.error('Failed to refresh user data:', error);
          this.logout();
        }
      }),
      map(response => response.success ? response.data || null : null)
    );
  }
}
