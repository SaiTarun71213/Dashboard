import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { WebSocketService, ConnectionStatus } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Observable streams (initialized in constructor)
  sectorData$!: Observable<any>;
  stateData$!: Observable<any>;
  connectionStatus$!: Observable<ConnectionStatus>;

  // Backend connection status
  backendStatus: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private webSocketService: WebSocketService
  ) {
    // Initialize observable streams
    this.sectorData$ = this.webSocketService.sectorData$;
    this.stateData$ = this.webSocketService.stateData$;
    this.connectionStatus$ = this.webSocketService.connectionStatus$;
  }

  ngOnInit(): void {
    // Subscribe to real-time data
    this.webSocketService.subscribeToLevel('SECTOR');
    this.webSocketService.subscribeToLevel('STATE');

    // Check backend connection
    this.checkBackendConnection();

    // Load initial data
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check backend connection status
   */
  private checkBackendConnection(): void {
    // Test backend API connection
    fetch('http://localhost:3000/api')
      .then(response => response.json())
      .then(data => {
        this.backendStatus = {
          connected: true,
          version: data.version || 'v1.0.0',
          endpoints: Object.keys(data.endpoints || {}).length || 50
        };
      })
      .catch(error => {
        console.error('Backend connection failed:', error);
        this.backendStatus = {
          connected: false,
          error: error.message
        };
      });
  }

  /**
   * Load initial data from API
   */
  private loadInitialData(): void {
    // Load sector aggregation
    this.apiService.getSectorAggregation('1h')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Initial sector data loaded:', response.data);
          }
        },
        error: (error) => {
          console.error('Failed to load sector data:', error);
        }
      });

    // Load state aggregations
    this.apiService.getStateAggregations('1h')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Initial state data loaded:', response.data);
          }
        },
        error: (error) => {
          console.error('Failed to load state data:', error);
        }
      });
  }

  /**
   * Refresh data manually
   */
  refreshData(): void {
    this.webSocketService.requestRefresh();
    this.loadInitialData();
  }

  /**
   * Get formatted uptime
   */
  getUptime(): string {
    return this.webSocketService.getFormattedUptime();
  }
}
