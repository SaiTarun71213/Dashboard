import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Observable, Subscription } from 'rxjs';

import { WebSocketService } from '../../services/websocket.service';
import { MockDataService, SectorData, StateData } from '../../services/mock-data.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit, OnDestroy {
  sectorData$: Observable<any>;
  stateData$: Observable<StateData[]>;
  isLoading = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private webSocketService: WebSocketService,
    private mockDataService: MockDataService
  ) {
    this.sectorData$ = this.webSocketService.sectorData$;
    this.stateData$ = this.mockDataService.stateData$;
  }

  ngOnInit(): void {
    // Subscribe to data and stop loading when data arrives
    const sectorSub = this.sectorData$.subscribe(data => {
      if (data) {
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sectorSub);
    
    // Enable mock data immediately for demo
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Get status color for state
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return '#4caf50';
      case 'offline': return '#f44336';
      case 'maintenance': return '#ff9800';
      default: return '#9e9e9e';
    }
  }

  /**
   * Get status icon for state
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'online': return 'check_circle';
      case 'offline': return 'error';
      case 'maintenance': return 'build';
      default: return 'help';
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.webSocketService.requestRefresh();
  }

  /**
   * Get efficiency color based on value
   */
  getEfficiencyColor(efficiency: number): string {
    if (efficiency >= 90) return '#4caf50';
    if (efficiency >= 80) return '#8bc34a';
    if (efficiency >= 70) return '#ffc107';
    return '#f44336';
  }
}
