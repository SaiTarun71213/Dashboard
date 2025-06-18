import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { GridsterModule, GridsterConfig, GridsterItem, GridType, CompactType, DisplayGrid } from 'angular-gridster2';

import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { WidgetConfigDialogComponent, WidgetConfigData } from '../widget-config-dialog/widget-config-dialog.component';
import { ChartWidgetComponent } from '../chart-widget/chart-widget.component';

// Dashboard interfaces
export interface DashboardWidget extends GridsterItem {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  chartId?: string;
  config: any;
  // GridsterItem properties: x, y, cols, rows
}

export interface DashboardTemplate {
  id?: string;
  name: string;
  description: string;
  level: 'EQUIPMENT' | 'PLANT' | 'STATE' | 'SECTOR';
  dashboardType: 'LIVE' | 'ANALYTICAL';
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
    gap: number;
  };
  isTemplate: boolean;
  templateCategory?: string;
  tags: string[];
}

export interface WidgetTemplate {
  id: string;
  name: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  description: string;
  icon: string;
  defaultConfig: any;
  defaultSize: { width: number; height: number };
  category: string;
  chartId?: string; // Optional chart ID for saved charts
}

@Component({
  selector: 'app-dashboard-designer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatGridListModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DragDropModule,
    GridsterModule,
    ChartWidgetComponent
  ],
  templateUrl: './dashboard-designer.component.html',
  styleUrl: './dashboard-designer.component.scss'
})
export class DashboardDesignerComponent implements OnInit, OnDestroy {
  // Form and state management
  dashboardForm: FormGroup;
  isLoading = false;
  isSaving = false;

  // Dashboard data
  currentDashboard: DashboardTemplate | null = null;
  dashboardWidgets: DashboardWidget[] = [];

  // Templates and widgets
  dashboardTemplates: DashboardTemplate[] = [];
  widgetTemplates: WidgetTemplate[] = [];
  availableCharts: any[] = [];
  savedCharts: any[] = [];
  savedDashboards: any[] = [];

  // UI state
  selectedTab = 0;
  gridColumns = 12;
  gridRows = 8;
  showGrid = true;

  // Gridster configuration
  gridsterOptions: GridsterConfig = {
    gridType: GridType.VerticalFixed,
    compactType: CompactType.None,
    margin: 10,
    outerMargin: true,
    outerMarginTop: 10,
    outerMarginRight: 10,
    outerMarginBottom: 10,
    outerMarginLeft: 10,
    useTransformPositioning: true,
    mobileBreakpoint: 640,
    minCols: 12, // Always maintain 12 columns
    maxCols: 12, // Lock to 12 columns
    minRows: 1,
    maxRows: 100,
    maxItemCols: 12, // Max widget width is 12 columns
    minItemCols: 1,
    maxItemRows: 100,
    minItemRows: 1,
    maxItemArea: 2500,
    minItemArea: 1,
    defaultItemCols: 3,
    defaultItemRows: 2,
    fixedColWidth: undefined, // Let it calculate based on container width
    fixedRowHeight: 120, // Fixed row height for consistent layout
    keepFixedHeightInMobile: true,
    keepFixedWidthInMobile: false,
    scrollSensitivity: 10,
    scrollSpeed: 20,
    enableEmptyCellClick: false,
    enableEmptyCellContextMenu: false,
    enableEmptyCellDrop: true,
    enableEmptyCellDrag: false,
    enableOccupiedCellDrop: false,
    emptyCellDragMaxCols: 50,
    emptyCellDragMaxRows: 50,
    ignoreMarginInRow: false,
    draggable: {
      enabled: true,
    },
    resizable: {
      enabled: true,
    },
    swap: false,
    pushItems: true,
    disablePushOnDrag: false,
    disablePushOnResize: false,
    pushDirections: { north: true, east: true, south: true, west: true },
    pushResizeItems: false,
    displayGrid: DisplayGrid.OnDragAndResize,
    disableWindowResize: false,
    disableWarnings: false,
    scrollToNewItems: true
  };

  // Observables
  private subscriptions: Subscription[] = [];

  // Data levels and types
  dataLevels = [
    { value: 'EQUIPMENT', label: 'Equipment Level' },
    { value: 'PLANT', label: 'Plant Level' },
    { value: 'STATE', label: 'State Level' },
    { value: 'SECTOR', label: 'Sector Level' }
  ];

  dashboardTypes = [
    { value: 'LIVE', label: 'Live Dashboard', description: 'Real-time data updates' },
    { value: 'ANALYTICAL', label: 'Analytical Dashboard', description: 'Historical data analysis' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dashboardForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.initializeWidgetTemplates();

    // Debug: Log initial state
    console.log('Dashboard Designer initialized');
    console.log('Widget templates:', this.widgetTemplates);
    console.log('Dashboard widgets:', this.dashboardWidgets);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Create reactive form for dashboard configuration
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      level: ['PLANT', Validators.required],
      dashboardType: ['LIVE', Validators.required],
      columns: [12, [Validators.required, Validators.min(6), Validators.max(24)]],
      rows: [8, [Validators.required, Validators.min(4), Validators.max(16)]],
      gap: [16, [Validators.required, Validators.min(8), Validators.max(32)]],
      tags: [[]],
      isTemplate: [false]
    });
  }

  /**
   * Load initial data for dashboard designer
   */
  private loadInitialData(): void {
    this.isLoading = true;

    // Load dashboard templates
    const templatesObs = this.apiService.getDashboardTemplates();

    // Load saved charts
    const chartsObs = this.apiService.getCharts();

    // Load saved dashboards
    const dashboardsObs = this.apiService.getUserDashboards();

    // Subscribe to data loading
    const templatesSub = templatesObs.subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          this.dashboardTemplates = response.data;
        } else {
          this.dashboardTemplates = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading dashboard templates:', error);
        this.dashboardTemplates = [];
        this.showError('Failed to load dashboard templates');
      }
    });

    const chartsSub = chartsObs.subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.savedCharts = Array.isArray(response.data) ? response.data : response.data.charts || [];
          this.availableCharts = this.savedCharts;

          // Update widget templates to include saved charts
          this.updateWidgetTemplatesWithCharts();
        } else {
          this.savedCharts = [];
          this.availableCharts = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading charts:', error);
        this.savedCharts = [];
        this.availableCharts = [];
        this.showError('Failed to load saved charts');
      }
    });

    const dashboardsSub = dashboardsObs.subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.savedDashboards = response.data.dashboards || [];
          console.log('Loaded saved dashboards:', this.savedDashboards);
        } else {
          this.savedDashboards = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading dashboards:', error);
        this.savedDashboards = [];
        this.showError('Failed to load saved dashboards');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(templatesSub, chartsSub, dashboardsSub);
  }

  /**
   * Get widgets filtered by category
   */
  getWidgetsByCategory(category: string): WidgetTemplate[] {
    return this.widgetTemplates.filter(widget => widget.category === category);
  }

  /**
   * Predicate function to determine if a widget can be dropped
   */
  canDropWidget = (drag: any, drop: any) => {
    // Allow dropping widget templates onto the dashboard canvas
    return drop.id === 'dashboard-canvas';
  }

  /**
   * Initialize widget templates for drag-drop
   */
  private initializeWidgetTemplates(): void {
    this.widgetTemplates = [
      {
        id: 'power-metric',
        name: 'Power Metric',
        type: 'metric',
        description: 'Display total power generation',
        icon: 'flash_on',
        category: 'Metrics',
        defaultConfig: {
          metric: {
            field: 'electrical.activePower',
            label: 'Total Power',
            unit: 'kW',
            aggregation: 'SUM'
          }
        },
        defaultSize: { width: 3, height: 2 }
      },
      {
        id: 'efficiency-metric',
        name: 'Efficiency Metric',
        type: 'metric',
        description: 'Display average efficiency',
        icon: 'trending_up',
        category: 'Metrics',
        defaultConfig: {
          metric: {
            field: 'performance.efficiency',
            label: 'Efficiency',
            unit: '%',
            aggregation: 'AVERAGE'
          }
        },
        defaultSize: { width: 3, height: 2 }
      },
      {
        id: 'line-chart',
        name: 'Line Chart',
        type: 'chart',
        description: 'Time series line chart',
        icon: 'show_chart',
        category: 'Charts',
        defaultConfig: {
          chartType: 'line',
          xAxis: { field: 'timestamp', type: 'datetime' },
          yAxis: { field: 'electrical.activePower', type: 'number' }
        },
        defaultSize: { width: 6, height: 4 }
      },
      {
        id: 'equipment-table',
        name: 'Equipment Table',
        type: 'table',
        description: 'Equipment status table',
        icon: 'table_chart',
        category: 'Tables',
        defaultConfig: {
          columns: ['name', 'status', 'activePower', 'efficiency'],
          sortBy: 'name',
          pageSize: 10
        },
        defaultSize: { width: 8, height: 4 }
      },
      {
        id: 'scrollable-content',
        name: 'Scrollable Content',
        type: 'text',
        description: 'Widget with scrollable content',
        icon: 'article',
        category: 'Tables',
        defaultConfig: {
          content: 'This is a test widget with lots of content to demonstrate scrolling functionality.'
        },
        defaultSize: { width: 4, height: 3 }
      }
    ];
  }

  /**
   * Update widget templates to include saved charts
   */
  private updateWidgetTemplatesWithCharts(): void {
    // Add saved charts as widget templates
    const chartTemplates = this.savedCharts.map(chart => ({
      id: `saved-chart-${chart.id}`,
      name: chart.name || chart.title || 'Saved Chart',
      type: 'chart' as const,
      description: chart.description || 'Saved chart from chart builder',
      icon: this.getChartIcon(chart.chartType || chart.type),
      category: 'Saved Charts',
      chartId: chart.id,
      defaultConfig: {
        chartId: chart.id,
        chartType: chart.chartType || chart.type,
        chartConfig: chart.config || chart,
        title: chart.name || chart.title,
        ...chart.config
      },
      defaultSize: { width: 6, height: 4 }
    }));

    // Add chart templates to widget templates
    this.widgetTemplates = [...this.widgetTemplates, ...chartTemplates];
  }

  /**
   * Get appropriate icon for chart type
   */
  private getChartIcon(chartType: string): string {
    const iconMap: { [key: string]: string } = {
      'line': 'show_chart',
      'bar': 'bar_chart',
      'column': 'bar_chart',
      'area': 'area_chart',
      'pie': 'pie_chart',
      'scatter': 'scatter_plot',
      'bubble': 'bubble_chart',
      'spline': 'show_chart'
    };
    return iconMap[chartType] || 'insert_chart';
  }

  /**
   * Handle widget drop from template to dashboard
   */
  onWidgetDrop(event: CdkDragDrop<any>): void {
    console.log('Widget drop event:', event);

    if (event.previousContainer === event.container) {
      // Reordering widgets within dashboard
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Adding new widget from template to dashboard
      const templateWidget = event.item.data as WidgetTemplate;
      console.log('Template widget:', templateWidget);

      if (templateWidget) {
        const dropPosition = this.calculateDropPosition(event);
        const newWidget: DashboardWidget = {
          id: this.generateWidgetId(),
          type: templateWidget.type,
          title: templateWidget.name,
          config: { ...templateWidget.defaultConfig },
          x: dropPosition.x,
          y: dropPosition.y,
          cols: templateWidget.defaultSize.width,
          rows: templateWidget.defaultSize.height
        };

        // Add widget to dashboard
        this.dashboardWidgets.push(newWidget);
        console.log('Added widget to dashboard:', newWidget);
        console.log('Current dashboard widgets:', this.dashboardWidgets);

        this.showSuccess(`Added ${templateWidget.name} to dashboard`);
      }
    }
  }

  // Gridster handles drag/drop automatically, no need for manual drag end handling

  /**
   * Calculate widget position based on drop location
   */
  private calculateDropPosition(event: CdkDragDrop<DashboardWidget[]>): { x: number; y: number } {
    // Try to get mouse position from the drop event
    const dropPoint = event.dropPoint;

    if (dropPoint) {
      // Get the dashboard canvas element
      const canvasElement = document.querySelector('.dashboard-canvas') as HTMLElement;
      if (canvasElement) {
        const canvasRect = canvasElement.getBoundingClientRect();

        // Calculate relative position within the canvas
        const relativeX = dropPoint.x - canvasRect.left;
        const relativeY = dropPoint.y - canvasRect.top;

        // Convert to grid coordinates
        const cellWidth = canvasRect.width / this.gridColumns;
        const cellHeight = 60; // Approximate row height

        const gridX = Math.max(0, Math.floor(relativeX / cellWidth));
        const gridY = Math.max(0, Math.floor(relativeY / cellHeight));

        return {
          x: Math.min(gridX, this.gridColumns - 3), // Ensure widget fits
          y: gridY
        };
      }
    }

    // Fallback: Find next available position
    return this.findNextAvailablePosition();
  }

  /**
   * Find next available position in the grid
   */
  private findNextAvailablePosition(): { x: number; y: number } {
    const widgetWidth = 3;
    const widgetHeight = 2;

    // Check each position in the grid
    for (let y = 0; y < this.gridRows - widgetHeight + 1; y++) {
      for (let x = 0; x < this.gridColumns - widgetWidth + 1; x++) {
        if (this.isPositionAvailable(x, y, widgetWidth, widgetHeight)) {
          return { x, y };
        }
      }
    }

    // If no space available, place at 0,0 (will overlap)
    return { x: 0, y: 0 };
  }

  /**
   * Check if a position is available for a widget
   */
  private isPositionAvailable(x: number, y: number, width: number, height: number): boolean {
    return !this.dashboardWidgets.some(widget => {
      const wx = widget.x || 0;
      const wy = widget.y || 0;
      const ww = widget.cols || 3;
      const wh = widget.rows || 2;

      // Check for overlap
      return !(x >= wx + ww || x + width <= wx || y >= wy + wh || y + height <= wy);
    });
  }

  /**
   * Generate unique widget ID
   */
  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Apply dashboard template
   */
  applyTemplate(template: DashboardTemplate): void {
    this.currentDashboard = { ...template };
    this.dashboardWidgets = [...template.widgets];

    // Update form with template data
    this.dashboardForm.patchValue({
      name: `${template.name} (Copy)`,
      description: template.description,
      level: template.level,
      dashboardType: template.dashboardType,
      columns: template.layout.columns,
      rows: template.layout.rows,
      gap: template.layout.gap,
      tags: template.tags,
      isTemplate: false
    });

    this.gridColumns = template.layout.columns;
    this.gridRows = template.layout.rows;

    this.showSuccess(`Applied template: ${template.name}`);
  }

  /**
   * Save dashboard
   */
  saveDashboard(): void {
    if (this.dashboardForm.invalid) {
      this.showError('Please fill in all required fields');
      return;
    }

    this.isSaving = true;
    const formValue = this.dashboardForm.value;

    const dashboardData: DashboardTemplate = {
      ...formValue,
      widgets: this.dashboardWidgets,
      layout: {
        columns: formValue.columns,
        rows: formValue.rows,
        gap: formValue.gap
      }
    };

    const saveObs = this.currentDashboard?.id
      ? this.apiService.updateDashboard(this.currentDashboard.id, dashboardData)
      : this.apiService.createDashboard(dashboardData);

    const saveSub = saveObs.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.currentDashboard = response.data as DashboardTemplate;
          this.showSuccess('Dashboard saved successfully');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error saving dashboard:', error);
        this.showError('Failed to save dashboard');
        this.isSaving = false;
      }
    });

    this.subscriptions.push(saveSub);
  }

  /**
   * Create new dashboard
   */
  createNewDashboard(): void {
    this.currentDashboard = null;
    this.dashboardWidgets = [];

    // Clear metric value cache
    this.metricValueCache.clear();

    this.dashboardForm.reset({
      level: 'PLANT',
      dashboardType: 'LIVE',
      columns: 12,
      rows: 8,
      gap: 16,
      tags: [],
      isTemplate: false
    });
    this.gridColumns = 12;
    this.gridRows = 8;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Remove widget from dashboard
   */
  removeWidget(index: number): void {
    if (index >= 0 && index < this.dashboardWidgets.length) {
      const widget = this.dashboardWidgets[index];

      // Clear cached metric value
      this.metricValueCache.delete(widget.id);

      this.dashboardWidgets.splice(index, 1);
      this.showSuccess(`Removed ${widget.title} from dashboard`);
    }
  }

  // Cache for metric values to prevent ExpressionChangedAfterItHasBeenCheckedError
  private metricValueCache = new Map<string, string>();

  /**
   * Get metric value for preview (mock data)
   */
  getMetricValue(widget: DashboardWidget): string {
    if (widget.type !== 'metric' || !widget.config.metric) {
      return '0';
    }

    // Use widget ID as cache key
    const cacheKey = widget.id;

    // Return cached value if exists
    if (this.metricValueCache.has(cacheKey)) {
      return this.metricValueCache.get(cacheKey)!;
    }

    const field = widget.config.metric.field;
    const unit = widget.config.metric.unit || '';

    // Generate mock values based on field type (only once per widget)
    let value: number;
    switch (field) {
      case 'electrical.activePower':
        value = 1850 + Math.random() * 300;
        break;
      case 'performance.efficiency':
        value = 85 + Math.random() * 10;
        break;
      case 'electrical.voltage.l1':
        value = 690 + Math.random() * 20;
        break;
      case 'electrical.current.l1':
        value = 1800 + Math.random() * 200;
        break;
      default:
        value = Math.random() * 100;
    }

    const formattedValue = value.toFixed(1);

    // Cache the value
    this.metricValueCache.set(cacheKey, formattedValue);

    return formattedValue;
  }

  /**
   * Update grid layout when form values change
   */
  onLayoutChange(): void {
    const formValue = this.dashboardForm.value;
    this.gridColumns = formValue.columns || 12;
    this.gridRows = formValue.rows || 8;
  }

  /**
   * Preview dashboard (navigate to preview mode)
   */
  previewDashboard(): void {
    if (this.dashboardWidgets.length === 0) {
      this.showError('Add some widgets to preview the dashboard');
      return;
    }

    // TODO: Implement dashboard preview functionality
    this.showSuccess('Dashboard preview functionality coming soon!');
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(): void {
    if (!this.currentDashboard && this.dashboardWidgets.length === 0) {
      this.showError('No dashboard to export');
      return;
    }

    const exportData = {
      ...this.dashboardForm.value,
      widgets: this.dashboardWidgets,
      layout: {
        columns: this.gridColumns,
        rows: this.gridRows,
        gap: this.dashboardForm.get('gap')?.value || 16
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportData.name || 'dashboard'}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.showSuccess('Dashboard configuration exported successfully');
  }

  /**
   * Add test widget for debugging
   */
  addTestWidget(): void {
    const testWidget: DashboardWidget = {
      id: this.generateWidgetId(),
      type: 'metric',
      title: 'Test Power Metric',
      config: {
        metric: {
          field: 'electrical.activePower',
          label: 'Test Power',
          unit: 'kW',
          aggregation: 'SUM'
        }
      },
      x: 0,
      y: 0,
      cols: 3,
      rows: 2
    };

    this.dashboardWidgets.push(testWidget);
    console.log('Added test widget:', testWidget);
    console.log('Current dashboard widgets:', this.dashboardWidgets);
    this.showSuccess('Test widget added successfully!');
  }

  /**
   * Add widget from template (for drag/drop from sidebar)
   */
  addWidgetFromTemplate(template: WidgetTemplate): void {
    const newWidget: DashboardWidget = {
      id: this.generateWidgetId(),
      type: template.type,
      title: template.name,
      config: { ...template.defaultConfig },
      x: 0,
      y: 0,
      cols: template.defaultSize.width,
      rows: template.defaultSize.height
    };

    this.dashboardWidgets.push(newWidget);
    this.showSuccess(`Added ${template.name} to dashboard`);
  }

  /**
   * Configure widget settings
   */
  configureWidget(widget: DashboardWidget): void {
    const dialogData: WidgetConfigData = {
      widget: widget,
      availableFields: this.getAvailableFields(),
      availableCharts: this.availableCharts
    };

    const dialogRef = this.dialog.open(WidgetConfigDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Update the widget with new configuration
        const index = this.dashboardWidgets.findIndex(w => w.id === widget.id);
        if (index !== -1) {
          this.dashboardWidgets[index] = result;
          this.showSuccess('Widget configuration updated');
        }
      }
    });
  }

  /**
   * Get available data fields for configuration
   */
  private getAvailableFields(): string[] {
    return [
      'electrical.activePower',
      'electrical.reactivePower',
      'electrical.voltage.l1',
      'electrical.voltage.l2',
      'electrical.voltage.l3',
      'electrical.current.l1',
      'electrical.current.l2',
      'electrical.current.l3',
      'electrical.frequency',
      'electrical.totalEnergy',
      'performance.efficiency',
      'performance.capacity',
      'environmental.temperature',
      'environmental.humidity',
      'environmental.windSpeed',
      'environmental.solarIrradiance',
      'status.operational',
      'status.alarmCount',
      'timestamp'
    ];
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        // Validate import data structure
        if (!importData.widgets || !Array.isArray(importData.widgets)) {
          throw new Error('Invalid dashboard format');
        }

        // Apply imported data
        this.dashboardWidgets = importData.widgets;
        this.dashboardForm.patchValue({
          name: importData.name || 'Imported Dashboard',
          description: importData.description || '',
          level: importData.level || 'PLANT',
          dashboardType: importData.dashboardType || 'LIVE',
          columns: importData.layout?.columns || 12,
          rows: importData.layout?.rows || 8,
          gap: importData.layout?.gap || 16,
          tags: importData.tags || [],
          isTemplate: false
        });

        this.gridColumns = importData.layout?.columns || 12;
        this.gridRows = importData.layout?.rows || 8;

        this.showSuccess('Dashboard imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        this.showError('Failed to import dashboard. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }
}
