import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

// Import from our library
import { CustomGridComponent } from '../grid-system/components/custom-grid.component';
import { GridConfig, GridItem } from '../grid-system/interfaces/grid.interfaces';

@Component({
  selector: 'app-library-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    FormsModule,
    CustomGridComponent
  ],
  template: `
    <div class="library-demo-container">
      
      <!-- Header -->
      <div class="demo-header">
        <h1>🎯 NgAdvancedGrid Library Demo</h1>
        <p>Showcasing the power of our custom grid system as a reusable library</p>
        
        <div class="library-info">
          <mat-card>
            <mat-card-header>
              <mat-card-title>📦 Library Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Package Name:</strong> ng-advanced-grid
                </div>
                <div class="info-item">
                  <strong>Version:</strong> 1.0.0
                </div>
                <div class="info-item">
                  <strong>Bundle Size:</strong> ~100KB (gzipped)
                </div>
                <div class="info-item">
                  <strong>Dependencies:</strong> Angular 17+, RxJS 7+
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Demo Tabs -->
      <mat-tab-group>
        
        <!-- Basic Demo -->
        <mat-tab label="Basic Demo">
          <div class="tab-content">
            <div class="demo-controls">
              <button mat-raised-button color="primary" (click)="addRandomWidget()">
                <mat-icon>add</mat-icon>
                Add Widget
              </button>
              <button mat-raised-button (click)="compactGrid()">
                <mat-icon>compress</mat-icon>
                Compact
              </button>
              <button mat-raised-button (click)="clearGrid()">
                <mat-icon>clear_all</mat-icon>
                Clear All
              </button>
              <button mat-raised-button (click)="exportLayout()">
                <mat-icon>download</mat-icon>
                Export Layout
              </button>
            </div>

            <div class="grid-container">
              <ng-advanced-grid
                #basicGrid
                [config]="basicConfig"
                [items]="basicItems"
                [itemTemplate]="basicTemplate"
                [showGrid]="true"
                (layoutChange)="onLayoutChange($event)"
                (itemClick)="onItemClick($event)">
              </ng-advanced-grid>
            </div>
          </div>
        </mat-tab>

        <!-- Dashboard Demo -->
        <mat-tab label="Dashboard Demo">
          <div class="tab-content">
            <div class="demo-controls">
              <button mat-raised-button color="primary" (click)="addDashboardWidget('metric')">
                <mat-icon>speed</mat-icon>
                Add Metric
              </button>
              <button mat-raised-button color="primary" (click)="addDashboardWidget('chart')">
                <mat-icon>show_chart</mat-icon>
                Add Chart
              </button>
              <button mat-raised-button color="primary" (click)="addDashboardWidget('table')">
                <mat-icon>table_chart</mat-icon>
                Add Table
              </button>
            </div>

            <div class="grid-container">
              <ng-advanced-grid
                #dashboardGrid
                [config]="dashboardConfig"
                [items]="dashboardItems"
                [itemTemplate]="dashboardTemplate"
                [showGrid]="false"
                (layoutChange)="onDashboardLayoutChange($event)">
              </ng-advanced-grid>
            </div>
          </div>
        </mat-tab>

        <!-- Styling Demo -->
        <mat-tab label="Styling Demo">
          <div class="tab-content">
            <div class="demo-controls">
              <div class="styling-controls">
                <h3>🎨 Grid Styling Options</h3>
                <div class="control-row">
                  <label>Background Color:</label>
                  <input type="color" [(ngModel)]="stylingConfig.gridBackgroundColor" (change)="updateStyling()">
                </div>
                <div class="control-row">
                  <label>Grid Line Color:</label>
                  <input type="color" [(ngModel)]="stylingConfig.gridLineColor" (change)="updateStyling()">
                </div>
                <div class="control-row">
                  <label>Grid Line Width:</label>
                  <input type="range" min="1" max="5" [(ngModel)]="stylingConfig.gridLineWidth" (change)="updateStyling()">
                  <span>{{ stylingConfig.gridLineWidth }}px</span>
                </div>
                <div class="control-row">
                  <label>Grid Line Style:</label>
                  <select [(ngModel)]="stylingConfig.gridLineStyle" (change)="updateStyling()">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
                <button mat-raised-button (click)="resetStyling()">Reset to Default</button>
              </div>
            </div>

            <div class="grid-container">
              <ng-advanced-grid
                #stylingGrid
                [config]="stylingConfig"
                [items]="stylingItems"
                [itemTemplate]="basicTemplate"
                [showGrid]="true"
                (layoutChange)="onStylingLayoutChange($event)">
              </ng-advanced-grid>
            </div>
          </div>
        </mat-tab>

        <!-- Installation -->
        <mat-tab label="Installation">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>📦 Installation Guide</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h3>1. Install the Package</h3>
                <pre><code>npm install ng-advanced-grid</code></pre>

                <h3>2. Import the Module</h3>
                <pre><code>import &#123; NgAdvancedGridModule &#125; from 'ng-advanced-grid';

&#64;NgModule(&#123;
  imports: [NgAdvancedGridModule],
  // ...
&#125;)
export class AppModule &#123; &#125;</code></pre>

                <h3>3. Use in Template</h3>
                <pre><code>&lt;ng-advanced-grid
  [config]="gridConfig"
  [items]="gridItems"
  [itemTemplate]="itemTemplate"
  (layoutChange)="onLayoutChange($event)"&gt;
&lt;/ng-advanced-grid&gt;</code></pre>

                <h3>4. Component Setup</h3>
                <pre><code>export class MyComponent &#123;
  gridConfig: GridConfig = &#123;
    columns: 12,
    margin: 10,
    cellHeight: 80,
    draggable: true,
    resizable: true,
    swapItems: false
  &#125;;

  gridItems: GridItem[] = [
    &#123; id: '1', x: 0, y: 0, width: 4, height: 3 &#125;
  ];
&#125;</code></pre>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

      </mat-tab-group>

      <!-- Templates -->
      <ng-template #basicTemplate let-item="item">
        <div class="basic-widget">
          <div class="widget-header">
            <span>{{ item.data?.title || 'Widget ' + item.id.slice(-4) }}</span>
            <button (click)="removeWidget(item.id)" (mousedown)="$event.stopPropagation()">×</button>
          </div>
          <div class="widget-content">
            <p><strong>ID:</strong> {{ item.id.slice(-8) }}</p>
            <p><strong>Position:</strong> ({{ item.x }}, {{ item.y }})</p>
            <p><strong>Size:</strong> {{ item.width }} × {{ item.height }}</p>
            <p>{{ item.data?.content || 'Drag me around or resize me!' }}</p>
          </div>
        </div>
      </ng-template>

      <ng-template #dashboardTemplate let-item="item">
        <div class="dashboard-widget" [ngSwitch]="item.data?.type">
          
          <!-- Metric Widget -->
          <div *ngSwitchCase="'metric'" class="metric-widget">
            <div class="metric-header">
              <mat-icon>{{ item.data.icon }}</mat-icon>
              <span>{{ item.data.title }}</span>
            </div>
            <div class="metric-value">{{ item.data.value }}</div>
            <div class="metric-unit">{{ item.data.unit }}</div>
          </div>

          <!-- Chart Widget -->
          <div *ngSwitchCase="'chart'" class="chart-widget">
            <div class="chart-header">
              <mat-icon>{{ item.data.icon }}</mat-icon>
              <span>{{ item.data.title }}</span>
            </div>
            <div class="chart-placeholder">
              <mat-icon>insert_chart</mat-icon>
              <span>Chart Visualization</span>
            </div>
          </div>

          <!-- Table Widget -->
          <div *ngSwitchCase="'table'" class="table-widget">
            <div class="table-header">
              <mat-icon>{{ item.data.icon }}</mat-icon>
              <span>{{ item.data.title }}</span>
            </div>
            <div class="table-placeholder">
              <mat-icon>table_chart</mat-icon>
              <span>Data Table</span>
            </div>
          </div>

        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .library-demo-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .demo-header h1 {
      color: #1976d2;
      margin-bottom: 10px;
    }

    .library-info {
      margin: 20px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .info-item {
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .demo-controls {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .grid-container {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      min-height: 500px;
      background: #fafafa;
    }

    /* Widget Styles */
    .basic-widget, .dashboard-widget {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .widget-header, .metric-header, .chart-header, .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      font-weight: 500;
    }

    .widget-header button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
    }

    .widget-header button:hover {
      color: #f44336;
    }

    .widget-content {
      flex: 1;
      padding: 12px;
      font-size: 14px;
      color: #666;
    }

    .widget-content p {
      margin: 4px 0;
    }

    /* Dashboard Widget Styles */
    .metric-widget {
      text-align: center;
      padding: 15px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
      margin: 10px 0;
    }

    .metric-unit {
      color: #888;
      font-size: 0.9rem;
    }

    .chart-placeholder, .table-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      gap: 10px;
    }

    /* Code blocks */
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }

    code {
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }

    h3 {
      color: #1976d2;
      margin-top: 20px;
    }

    /* Styling Controls */
    .styling-controls {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .styling-controls h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .control-row label {
      min-width: 120px;
      font-weight: 500;
    }

    .control-row input[type="color"] {
      width: 50px;
      height: 35px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .control-row input[type="range"] {
      flex: 1;
      max-width: 200px;
    }

    .control-row select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .control-row span {
      min-width: 40px;
      font-weight: 500;
      color: #666;
    }
  `]
})
export class LibraryDemoComponent {
  @ViewChild('basicGrid') basicGrid!: CustomGridComponent;
  @ViewChild('dashboardGrid') dashboardGrid!: CustomGridComponent;
  @ViewChild('stylingGrid') stylingGrid!: CustomGridComponent;

  // Basic Demo Configuration
  basicConfig: GridConfig = {
    columns: 12,
    margin: 10,
    cellHeight: 80,
    draggable: true,
    resizable: true,
    pushItems: true,
    swapItems: false,
    compactType: 'vertical',
    animate: true,
    animationDuration: 300
  };

  basicItems: GridItem[] = [
    {
      id: 'basic-1',
      x: 0, y: 0, width: 4, height: 3,
      data: { title: 'Draggable Widget', content: 'Try dragging me around!' }
    },
    {
      id: 'basic-2',
      x: 4, y: 0, width: 3, height: 2,
      data: { title: 'Resizable Widget', content: 'Resize me by dragging corners!' }
    }
  ];

  // Dashboard Demo Configuration
  dashboardConfig: GridConfig = {
    columns: 12,
    margin: 15,
    cellHeight: 90,
    draggable: true,
    resizable: true,
    pushItems: true,
    swapItems: false,
    compactType: 'vertical',
    animate: true,
    animationDuration: 250
  };

  dashboardItems: GridItem[] = [
    {
      id: 'dash-1',
      x: 0, y: 0, width: 3, height: 2,
      data: { type: 'metric', icon: 'flash_on', title: 'Active Power', value: '2,150', unit: 'kW' }
    },
    {
      id: 'dash-2',
      x: 3, y: 0, width: 3, height: 2,
      data: { type: 'metric', icon: 'battery_charging_full', title: 'Efficiency', value: '94.2', unit: '%' }
    },
    {
      id: 'dash-3',
      x: 6, y: 0, width: 6, height: 4,
      data: { type: 'chart', icon: 'show_chart', title: 'Power Generation Trend' }
    }
  ];

  // Styling Demo Configuration
  stylingConfig: GridConfig = {
    columns: 12,
    margin: 15,
    cellHeight: 80,
    draggable: true,
    resizable: true,
    pushItems: true,
    swapItems: false,
    compactType: 'vertical',
    animate: true,
    animationDuration: 300,
    gridBackgroundColor: '#f8f9fa',
    gridLineColor: '#dee2e6',
    gridLineWidth: 1,
    gridLineStyle: 'solid'
  };

  stylingItems: GridItem[] = [
    {
      id: 'style-1',
      x: 0, y: 0, width: 3, height: 2,
      data: { title: 'Styled Widget 1', content: 'Custom background and grid lines!' }
    },
    {
      id: 'style-2',
      x: 3, y: 0, width: 4, height: 3,
      data: { title: 'Styled Widget 2', content: 'Try changing the styling options above!' }
    },
    {
      id: 'style-3',
      x: 7, y: 0, width: 3, height: 2,
      data: { title: 'Styled Widget 3', content: 'Enhanced resize handles!' }
    }
  ];

  private nextBasicId = 3;
  private nextDashId = 4;

  addRandomWidget(): void {
    const sizes = [
      { width: 2, height: 2 },
      { width: 3, height: 2 },
      { width: 4, height: 3 },
      { width: 2, height: 3 }
    ];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    const newItem: Partial<GridItem> = {
      width: size.width,
      height: size.height,
      data: {
        title: `Widget ${this.nextBasicId}`,
        content: `Added at ${new Date().toLocaleTimeString()}`
      }
    };

    this.basicGrid.addItem(newItem);
    this.nextBasicId++;
  }

  addDashboardWidget(type: string): void {
    const widgets = {
      metric: {
        width: 3, height: 2,
        data: { type: 'metric', icon: 'speed', title: 'New Metric', value: '1,234', unit: 'units' }
      },
      chart: {
        width: 6, height: 4,
        data: { type: 'chart', icon: 'insert_chart', title: 'New Chart' }
      },
      table: {
        width: 8, height: 3,
        data: { type: 'table', icon: 'table_chart', title: 'New Table' }
      }
    };

    const widget = widgets[type as keyof typeof widgets];
    if (widget) {
      this.dashboardGrid.addItem(widget);
      this.nextDashId++;
    }
  }

  removeWidget(id: string): void {
    this.basicGrid.removeItem(id);
  }

  compactGrid(): void {
    this.basicGrid.compact();
  }

  clearGrid(): void {
    this.basicItems = [];
  }

  exportLayout(): void {
    const layout = this.basicGrid.exportLayout();
    console.log('Exported Layout:', layout);

    // Create download
    const blob = new Blob([layout], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onLayoutChange(layout: GridItem[]): void {
    this.basicItems = layout;
    console.log('Basic layout changed:', layout);
  }

  onDashboardLayoutChange(layout: GridItem[]): void {
    this.dashboardItems = layout;
    console.log('Dashboard layout changed:', layout);
  }

  onItemClick(item: GridItem): void {
    console.log('Item clicked:', item);
  }

  onStylingLayoutChange(layout: GridItem[]): void {
    this.stylingItems = layout;
    console.log('Styling layout changed:', layout);
  }

  updateStyling(): void {
    // Force update of the styling grid
    if (this.stylingGrid) {
      this.stylingGrid.refresh();
    }
  }

  resetStyling(): void {
    this.stylingConfig = {
      ...this.stylingConfig,
      gridBackgroundColor: '#f8f9fa',
      gridLineColor: '#dee2e6',
      gridLineWidth: 1,
      gridLineStyle: 'solid'
    };
    this.updateStyling();
  }
}
