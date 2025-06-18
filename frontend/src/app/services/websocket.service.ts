import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { MockDataService } from './mock-data.service';

/**
 * WEBSOCKET SERVICE
 * Handles real-time communication with the backend
 * Provides live data updates for charts and dashboards
 */

export interface RealTimeData {
  type: string;
  level: string;
  data: any;
  timestamp: string;
  metadata?: any;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  latency?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = 'http://localhost:3000';

  // Connection status
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0
  });
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  // Real-time data streams
  private sectorDataSubject = new BehaviorSubject<any>(null);
  private stateDataSubject = new BehaviorSubject<any>(null);
  private plantDataSubject = new BehaviorSubject<any>(null);
  private equipmentDataSubject = new BehaviorSubject<any>(null);
  private dashboardDataSubject = new BehaviorSubject<any>(null);

  public sectorData$ = this.sectorDataSubject.asObservable();
  public stateData$ = this.stateDataSubject.asObservable();
  public plantData$ = this.plantDataSubject.asObservable();
  public equipmentData$ = this.equipmentDataSubject.asObservable();
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  // Connection metrics
  private connectionStartTime: number = 0;
  private reconnectAttempts: number = 0;
  private useMockData: boolean = false;

  constructor(private mockDataService: MockDataService) {
    this.initializeConnection();
  }

  /**
   * Initialize WebSocket connection
   */
  private initializeConnection(): void {
    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.setupEventListeners();
      this.connectionStartTime = Date.now();

    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.updateConnectionStatus(false);
      this.enableMockData();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
      this.calculateLatency();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.updateConnectionStatus(false);

      // Enable mock data after multiple failed attempts
      if (this.reconnectAttempts >= 3) {
        this.enableMockData();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = attemptNumber;
      this.updateConnectionStatus(true);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄 WebSocket reconnection error:', error);
      this.reconnectAttempts++;
    });

    // Data events
    this.socket.on('sector-aggregation', (data) => {
      console.log('📊 Received sector aggregation:', data);
      this.sectorDataSubject.next(data);
    });

    this.socket.on('state-aggregations', (data) => {
      console.log('🏛️ Received state aggregations:', data);
      this.stateDataSubject.next(data);
    });

    this.socket.on('plant-aggregations', (data) => {
      console.log('🏭 Received plant aggregations:', data);
      this.plantDataSubject.next(data);
    });

    this.socket.on('equipment-readings', (data) => {
      console.log('⚡ Received equipment readings:', data);
      this.equipmentDataSubject.next(data);
    });

    this.socket.on('dashboard-summary', (data) => {
      console.log('📈 Received dashboard summary:', data);
      this.dashboardDataSubject.next(data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Pong response for latency calculation
    this.socket.on('pong', (data) => {
      const latency = Date.now() - data;
      this.updateLatency(latency);
    });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(connected: boolean): void {
    const currentStatus = this.connectionStatusSubject.value;
    this.connectionStatusSubject.next({
      ...currentStatus,
      connected,
      lastConnected: connected ? new Date() : currentStatus.lastConnected,
      reconnectAttempts: this.reconnectAttempts
    });
  }

  /**
   * Calculate connection latency
   */
  private calculateLatency(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping', Date.now());
    }
  }

  /**
   * Update latency in connection status
   */
  private updateLatency(latency: number): void {
    const currentStatus = this.connectionStatusSubject.value;
    this.connectionStatusSubject.next({
      ...currentStatus,
      latency
    });
  }

  /**
   * Connect to WebSocket (if not already connected)
   */
  connect(): void {
    if (!this.socket || !this.socket.connected) {
      this.initializeConnection();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateConnectionStatus(false);
    }
  }

  /**
   * Subscribe to specific data level
   */
  subscribeToLevel(level: string, entityIds?: string[]): void {
    if (this.socket && this.socket.connected) {
      const subscription = {
        level,
        entityIds: entityIds || []
      };

      this.socket.emit('subscribe', subscription);
      console.log(`📡 Subscribed to ${level} level data`, subscription);
    }
  }

  /**
   * Unsubscribe from specific data level
   */
  unsubscribeFromLevel(level: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe', { level });
      console.log(`📡 Unsubscribed from ${level} level data`);
    }
  }

  /**
   * Request manual data refresh
   */
  requestRefresh(level?: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('refresh-request', { level: level || 'all' });
      console.log(`🔄 Requested data refresh for ${level || 'all'} levels`);
    }
  }

  /**
   * Send authentication token for WebSocket
   */
  authenticate(token: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('authenticate', { token });
      console.log('🔐 WebSocket authentication sent');
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection uptime in milliseconds
   */
  getUptime(): number {
    if (this.connectionStatusSubject.value.connected && this.connectionStartTime) {
      return Date.now() - this.connectionStartTime;
    }
    return 0;
  }

  /**
   * Get formatted uptime string
   */
  getFormattedUptime(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000) % 60;
    const minutes = Math.floor(uptime / (1000 * 60)) % 60;
    const hours = Math.floor(uptime / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Listen to custom events
   */
  on(event: string): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on(event, (data) => observer.next(data));
      }

      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }

  /**
   * Emit custom events
   */
  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Enable mock data when backend is unavailable
   */
  private enableMockData(): void {
    if (this.useMockData) return;

    console.log('🔄 Enabling mock data mode');
    this.useMockData = true;

    // Subscribe to mock data
    this.mockDataService.sectorData$.subscribe(data => {
      this.sectorDataSubject.next(data);
    });

    this.mockDataService.stateData$.subscribe(data => {
      this.stateDataSubject.next(data);
    });

    // Simulate connection status for mock mode
    this.updateConnectionStatus(true);
  }

  /**
   * Check if using mock data
   */
  isUsingMockData(): boolean {
    return this.useMockData;
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}
