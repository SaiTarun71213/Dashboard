import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { CustomGridComponent } from '../components/custom-grid.component';
import { GridItem, GridConfig, EnergyWidget } from '../interfaces/grid.interfaces';

@Component({
  selector: 'app-grid-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    CustomGridComponent
  ],
  template: `
    <div class="grid-demo-container">
      
      <!-- Header -->
      <div class="demo-header">
        <h1>Custom Grid System Demo</h1>
        <p>Advanced drag-and-drop grid system for energy dashboard widgets</p>
      </div>
      
      <!-- Controls -->
      <div class="demo-controls">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Grid Controls</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            
            <div class="control-row">
              <mat-slide-toggle [(ngModel)]="showGrid">Show Grid</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="config.animate">Animate</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="config.draggable">Draggable</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="config.resizable">Resizable</mat-slide-toggle>
            </div>
            
            <div class="control-row">
              <mat-form-field>
                <mat-label>Columns</mat-label>
                <mat-select [(ngModel)]="config.columns" (selectionChange)="updateGrid()">
                  <mat-option [value]="6">6 Columns</mat-option>
                  <mat-option [value]="8">8 Columns</mat-option>
                  <mat-option [value]="12">12 Columns</mat-option>
                  <mat-option [value]="16">16 Columns</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>Compact Type</mat-label>
                <mat-select [(ngModel)]="config.compactType" (selectionChange)="updateGrid()">
                  <mat-option value="vertical">Vertical</mat-option>
                  <mat-option value="horizontal">Horizontal</mat-option>
                  <mat-option value="none">None</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>Cell Height</mat-label>
                <input matInput type="number" [(ngModel)]="config.cellHeight" (change)="updateGrid()">
              </mat-form-field>
            </div>
            
            <div class="control-row">
              <button mat-raised-button color="primary" (click)="addRandomWidget()">
                <mat-icon>add</mat-icon>
                Add Widget
              </button>
              
              <button mat-raised-button color="accent" (click)="compactGrid()">
                <mat-icon>compress</mat-icon>
                Compact
              </button>
              
              <button mat-raised-button (click)="clearGrid()">
                <mat-icon>clear_all</mat-icon>
                Clear All
              </button>
              
              <button mat-raised-button (click)="exportLayout()">
                <mat-icon>download</mat-icon>
                Export
              </button>
              
              <button mat-raised-button (click)="loadSampleLayout()">
                <mat-icon>dashboard</mat-icon>
                Load Sample
              </button>
            </div>
            
          </mat-card-content>
        </mat-card>
      </div>
      
      <!-- Grid Container -->
      <div class="grid-container">
        <ng-advanced-grid
          #customGrid
          [config]="config"
          [items]="gridItems"
          [itemTemplate]="itemTemplate"
          [showGrid]="showGrid"
          (layoutChange)="onLayoutChange($event)"
          (itemClick)="onItemClick($event)"
          (itemDoubleClick)="onItemDoubleClick($event)">
        </ng-advanced-grid>
      </div>
      
      <!-- Stats -->
      <div class="demo-stats">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Grid Statistics</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total Items:</span>
                <span class="stat-value">{{ gridItems.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Grid Columns:</span>
                <span class="stat-value">{{ config.columns }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Grid Height:</span>
                <span class="stat-value">{{ gridHeight }} rows</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Utilization:</span>
                <span class="stat-value">{{ utilization }}%</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
    </div>
    
    <!-- Widget Template -->
    <ng-template #itemTemplate let-item="item">
      <div class="widget-content" [ngSwitch]="item.data?.type">
        
        <!-- Metric Widget -->
        <div *ngSwitchCase="'metric'" class="metric-widget">
          <div class="metric-header">
            <mat-icon>{{ item.data.icon }}</mat-icon>
            <span class="metric-title">{{ item.data.title }}</span>
          </div>
          <div class="metric-value">{{ item.data.value }}</div>
          <div class="metric-unit">{{ item.data.unit }}</div>
        </div>
        
        <!-- Chart Widget -->
        <div *ngSwitchCase="'chart'" class="chart-widget">
          <div class="chart-header">
            <mat-icon>{{ item.data.icon }}</mat-icon>
            <span class="chart-title">{{ item.data.title }}</span>
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
            <span class="table-title">{{ item.data.title }}</span>
          </div>
          <div class="table-placeholder">
            <mat-icon>table_chart</mat-icon>
            <span>Data Table</span>
          </div>
        </div>
        
        <!-- Default Widget -->
        <div *ngSwitchDefault class="default-widget">
          <div class="widget-header">
            <mat-icon>widgets</mat-icon>
            <span>{{ item.data?.title || 'Widget ' + item.id.slice(-4) }}</span>
          </div>
          <div class="widget-body">
            <p>Grid Item: {{ item.id.slice(-8) }}</p>
            <p>Position: ({{ item.x }}, {{ item.y }})</p>
            <p>Size: {{ item.width }} × {{ item.height }}</p>
          </div>
          <div class="widget-actions">
            <button mat-icon-button (click)="removeWidget(item.id)" (mousedown)="$event.stopPropagation()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
        
      </div>
    </ng-template>
  `,
  styles: [`
    .grid-demo-container {
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
    
    .demo-controls {
      margin-bottom: 30px;
    }
    
    .control-row {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .grid-container {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      min-height: 600px;
      margin-bottom: 30px;
      background: #fafafa;
    }
    
    .demo-stats {
      margin-top: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .stat-label {
      font-weight: 500;
      color: #666;
    }
    
    .stat-value {
      font-weight: 600;
      color: #1976d2;
    }
    
    /* Widget Styles */
    .widget-content {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .metric-widget {
      text-align: center;
      padding: 15px;
    }
    
    .metric-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 10px;
      color: #666;
    }
    
    .metric-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 5px;
    }
    
    .metric-unit {
      color: #888;
      font-size: 0.9rem;
    }
    
    .chart-widget, .table-widget {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .chart-header, .table-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
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
    
    .default-widget {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
    }
    
    .widget-body {
      flex: 1;
      padding: 15px;
      font-size: 0.9rem;
      color: #666;
    }
    
    .widget-actions {
      padding: 5px;
      text-align: right;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class GridDemoComponent implements OnInit {
  @ViewChild('customGrid') customGrid!: CustomGridComponent;
  @ViewChild('itemTemplate') itemTemplate!: TemplateRef<any>;

  config: GridConfig = {
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

  gridItems: GridItem[] = [];
  showGrid = true;
  gridHeight = 0;
  utilization = 0;

  private widgetTypes = [
    { type: 'metric', icon: 'speed', title: 'Power Output', value: '1,850', unit: 'kW' },
    { type: 'metric', icon: 'battery_charging_full', title: 'Efficiency', value: '94.2', unit: '%' },
    { type: 'chart', icon: 'show_chart', title: 'Power Trend' },
    { type: 'chart', icon: 'pie_chart', title: 'Energy Distribution' },
    { type: 'table', icon: 'table_chart', title: 'Equipment Status' }
  ];

  ngOnInit(): void {
    this.loadSampleLayout();
  }

  addRandomWidget(): void {
    const widgetData = this.widgetTypes[Math.floor(Math.random() * this.widgetTypes.length)];
    const sizes = [
      { width: 2, height: 2 },
      { width: 3, height: 2 },
      { width: 4, height: 3 },
      { width: 6, height: 4 }
    ];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    const newItem: Partial<GridItem> = {
      width: size.width,
      height: size.height,
      data: { ...widgetData }
    };

    this.customGrid.addItem(newItem);
  }

  removeWidget(id: string): void {
    this.customGrid.removeItem(id);
  }

  compactGrid(): void {
    this.customGrid.compact();
  }

  clearGrid(): void {
    this.gridItems = [];
    this.updateStats();
  }

  updateGrid(): void {
    this.customGrid.refresh();
  }

  exportLayout(): void {
    const layout = this.customGrid.exportLayout();
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

  loadSampleLayout(): void {
    const sampleItems: GridItem[] = [
      {
        id: 'widget-1',
        x: 0, y: 0, width: 3, height: 2,
        data: { type: 'metric', icon: 'flash_on', title: 'Active Power', value: '2,150', unit: 'kW' }
      },
      {
        id: 'widget-2',
        x: 3, y: 0, width: 3, height: 2,
        data: { type: 'metric', icon: 'battery_charging_full', title: 'Efficiency', value: '94.2', unit: '%' }
      },
      {
        id: 'widget-3',
        x: 6, y: 0, width: 6, height: 4,
        data: { type: 'chart', icon: 'show_chart', title: 'Power Generation Trend' }
      },
      {
        id: 'widget-4',
        x: 0, y: 2, width: 6, height: 3,
        data: { type: 'table', icon: 'table_chart', title: 'Equipment Status' }
      },
      {
        id: 'widget-5',
        x: 0, y: 5, width: 4, height: 2,
        data: { type: 'chart', icon: 'pie_chart', title: 'Energy Distribution' }
      }
    ];

    this.gridItems = sampleItems;
    this.updateStats();
  }

  onLayoutChange(layout: GridItem[]): void {
    this.gridItems = layout;
    this.updateStats();
  }

  onItemClick(item: GridItem): void {
    console.log('Item clicked:', item);
  }

  onItemDoubleClick(item: GridItem): void {
    console.log('Item double-clicked:', item);
    // Example: Toggle item size
    const newWidth = item.width === 2 ? 4 : 2;
    const newHeight = item.height === 2 ? 3 : 2;
    this.customGrid.updateItem(item.id, { width: newWidth, height: newHeight });
  }

  private updateStats(): void {
    const totalCells = this.gridItems.reduce((sum, item) => sum + (item.width * item.height), 0);
    this.gridHeight = Math.max(0, ...this.gridItems.map(item => item.y + item.height));
    const gridArea = this.config.columns * this.gridHeight;
    this.utilization = gridArea > 0 ? Math.round((totalCells / gridArea) * 100) : 0;
  }
}
