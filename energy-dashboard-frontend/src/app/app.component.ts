import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { AuthService } from './services/auth.service';
import { WebSocketService, ConnectionStatus } from './services/websocket.service';
import { LoginComponent } from './components/login/login.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    LoginComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  title = 'Energy Dashboard';

  // Observable streams from services (initialized in constructor)
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<any>;
  isLoading$!: Observable<boolean>;
  authError$!: Observable<string | null>;
  connectionStatus$!: Observable<ConnectionStatus>;
  sectorData$!: Observable<any>;

  constructor(
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {
    // Initialize observable streams
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
    this.isLoading$ = this.authService.isLoading$;
    this.authError$ = this.authService.authError$;
    this.connectionStatus$ = this.webSocketService.connectionStatus$;
    this.sectorData$ = this.webSocketService.sectorData$;
  }

  ngOnInit(): void {
    // Initialize WebSocket connection
    this.webSocketService.connect();

    // Subscribe to sector-level data
    this.webSocketService.subscribeToLevel('SECTOR');
  }

  ngOnDestroy(): void {
    // Clean up WebSocket connection
    this.webSocketService.disconnect();
  }

  /**
   * Toggle side navigation
   */
  toggleSidenav(): void {
    this.sidenav.toggle();
  }

  /**
   * Open user profile
   */
  openProfile(): void {
    // TODO: Implement profile dialog
    console.log('Opening user profile...');
  }

  /**
   * Open settings
   */
  openSettings(): void {
    // TODO: Implement settings dialog
    console.log('Opening settings...');
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Check if user can access admin features
   */
  canAccessAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
