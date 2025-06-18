import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * API SERVICE
 * Handles all HTTP communication with the backend
 * Provides methods for authentication, charts, dashboards, and real-time data
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ChartConfiguration {
  _id: string;
  name: string;
  description?: string;
  chartType: string;
  level: string;
  xAxis: any;
  yAxis: any;
  series: any[];
  timeRange: string;
  realTime: any;
  metadata: any;
}

export interface Dashboard {
  _id: string;
  name: string;
  description?: string;
  level: string;
  dashboardType: string;
  items: DashboardWidget[];
  layout: any;
  settings: any;
  metadata: any;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: any;
  options: any;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private authTokenSubject = new BehaviorSubject<string | null>(null);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public authToken$ = this.authTokenSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load token from localStorage on service initialization
    const token = localStorage.getItem('authToken');
    if (token) {
      this.authTokenSubject.next(token);
    }
  }

  /**
   * Get HTTP headers (interceptors will handle auth)
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle API errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('API Error:', error);
    throw error;
  };

  // ==================== AUTHENTICATION ====================

  /**
   * Login user
   */
  login(credentials: LoginCredentials): Observable<ApiResponse<{ tokens: AuthTokens; user: User }>> {
    return this.http.post<ApiResponse<{ tokens: AuthTokens; user: User }>>(
      `${this.baseUrl}/auth/login`,
      credentials
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const { tokens, user } = response.data;
          this.authTokenSubject.next(tokens.accessToken);
          this.currentUserSubject.next(user);
          localStorage.setItem('authToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authTokenSubject.next(null);
    this.currentUserSubject.next(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Refresh access token
   */
  refreshToken(refreshToken: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
      `${this.baseUrl}/auth/profile`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== CHART BUILDER ====================

  /**
   * Get available fields for chart building
   */
  getAvailableFields(level: string, entityId?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (entityId) {
      params = params.set('entityId', entityId);
    }

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/chart-builder/fields/${level}`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get chart templates
   */
  getChartTemplates(level?: string, category?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);
    if (category) params = params.set('category', category);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/chart-builder/templates`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Create chart configuration
   */
  createChart(chartData: any): Observable<ApiResponse<ChartConfiguration>> {
    return this.http.post<ApiResponse<ChartConfiguration>>(
      `${this.baseUrl}/chart-builder/charts`,
      chartData,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get user charts
   */
  getUserCharts(params?: any): Observable<ApiResponse<{ charts: ChartConfiguration[]; pagination: any }>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<ApiResponse<{ charts: ChartConfiguration[]; pagination: any }>>(
      `${this.baseUrl}/chart-builder/charts`,
      { headers: this.getHeaders(), params: httpParams }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get chart data for visualization
   */
  getChartData(chartId: string, options?: any): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (options) {
      Object.keys(options).forEach(key => {
        if (options[key] !== null && options[key] !== undefined) {
          params = params.set(key, options[key]);
        }
      });
    }

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/chart-builder/charts/${chartId}/data`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Update chart configuration
   */
  updateChart(chartId: string, chartData: any): Observable<ApiResponse<ChartConfiguration>> {
    return this.http.put<ApiResponse<ChartConfiguration>>(
      `${this.baseUrl}/chart-builder/charts/${chartId}`,
      chartData,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Delete chart configuration
   */
  deleteChart(chartId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/chart-builder/charts/${chartId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== DASHBOARD LAYOUT ====================

  /**
   * Get dashboard templates
   */
  getDashboardTemplates(level?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/dashboard-layout/templates`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get widget templates
   */
  getWidgetTemplates(type?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/dashboard-layout/widget-templates`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get all charts (using chart-builder endpoint)
   */
  getCharts(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/chart-builder/charts`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get specific chart by ID
   */
  getChart(chartId: string): Observable<ApiResponse<ChartConfiguration>> {
    return this.http.get<ApiResponse<ChartConfiguration>>(
      `${this.baseUrl}/chart-builder/charts/${chartId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Create dashboard
   */
  createDashboard(dashboardData: any): Observable<ApiResponse<Dashboard>> {
    return this.http.post<ApiResponse<Dashboard>>(
      `${this.baseUrl}/dashboard-layout/dashboards`,
      dashboardData,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get user dashboards
   */
  getUserDashboards(params?: any): Observable<ApiResponse<{ dashboards: Dashboard[]; pagination: any }>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<ApiResponse<{ dashboards: Dashboard[]; pagination: any }>>(
      `${this.baseUrl}/dashboard-layout/dashboards`,
      { headers: this.getHeaders(), params: httpParams }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get dashboard with data
   */
  getDashboard(dashboardId: string, options?: any): Observable<ApiResponse<{ dashboard: Dashboard }>> {
    let params = new HttpParams();
    if (options) {
      Object.keys(options).forEach(key => {
        if (options[key] !== null && options[key] !== undefined) {
          params = params.set(key, options[key]);
        }
      });
    }

    return this.http.get<ApiResponse<{ dashboard: Dashboard }>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Update dashboard
   */
  updateDashboard(dashboardId: string, dashboardData: any): Observable<ApiResponse<Dashboard>> {
    return this.http.put<ApiResponse<Dashboard>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}`,
      dashboardData,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Add widget to dashboard
   */
  addWidget(dashboardId: string, widgetData: any): Observable<ApiResponse<DashboardWidget>> {
    return this.http.post<ApiResponse<DashboardWidget>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}/widgets`,
      widgetData,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Update widget layout
   */
  updateWidgetLayout(dashboardId: string, widgetId: string, layout: any): Observable<ApiResponse<DashboardWidget>> {
    return this.http.put<ApiResponse<DashboardWidget>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}/widgets/${widgetId}/layout`,
      layout,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Remove widget from dashboard
   */
  removeWidget(dashboardId: string, widgetId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/dashboard-layout/dashboards/${dashboardId}/widgets/${widgetId}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== AGGREGATION DATA ====================

  /**
   * Get sector aggregation
   */
  getSectorAggregation(timeWindow?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (timeWindow) params = params.set('timeWindow', timeWindow);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/aggregation/sector`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get state aggregations
   */
  getStateAggregations(timeWindow?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (timeWindow) params = params.set('timeWindow', timeWindow);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/aggregation/states`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Get plant aggregations
   */
  getPlantAggregations(stateId?: string, timeWindow?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (stateId) params = params.set('stateId', stateId);
    if (timeWindow) params = params.set('timeWindow', timeWindow);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/aggregation/plants`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }
}
