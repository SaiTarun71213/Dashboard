import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

import { Subscription } from 'rxjs';

import { ChartBuilderService, ChartConfiguration, FieldMapping, ChartSeries } from '../../services/chart-builder.service';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-chart-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatProgressBarModule,
    // DragDropModule,
    HighchartsChartModule
  ],
  templateUrl: './chart-builder.component.html',
  styleUrls: ['./chart-builder.component.scss']
})
export class ChartBuilderComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  // Highcharts configuration
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: any = {};

  // Form and configuration
  configForm: FormGroup;
  currentConfig: ChartConfiguration | null = null;

  // Available fields for drag-drop
  availableFields: FieldMapping[] = [];
  filteredFields: FieldMapping[] = [];

  // Dynamic field selections based on chart type
  xAxisField: FieldMapping | null = null;
  yAxisField: FieldMapping | null = null;
  labelField: FieldMapping | null = null;
  valueField: FieldMapping | null = null;
  categoryField: FieldMapping | null = null;
  sizeField: FieldMapping | null = null;
  seriesFields: FieldMapping[] = [];

  // Current chart type configuration
  currentChartTypeConfig: any = null;

  // Chart data
  chartData: any[] = [];
  isLoadingData = false;

  // UI state
  selectedLevel = 'EQUIPMENT';
  selectedChartType = 'line';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private chartBuilderService: ChartBuilderService,
    private mockDataService: MockDataService
  ) {
    this.configForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.createNewChart();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Initialize component
   */
  private initializeComponent(): void {
    this.availableFields = this.chartBuilderService.getFieldsForLevel(this.selectedLevel);
    this.filteredFields = [...this.availableFields];
  }

  /**
   * Setup reactive subscriptions
   */
  private setupSubscriptions(): void {
    // Subscribe to current configuration changes
    const configSub = this.chartBuilderService.currentConfig$.subscribe(config => {
      if (config) {
        this.currentConfig = config;
        this.updateFormFromConfig(config);
        this.updateChart();
      }
    });

    // Subscribe to form changes
    const formSub = this.configForm.valueChanges.subscribe(value => {
      if (this.currentConfig) {
        this.updateConfigFromForm(value);
      }
    });

    this.subscriptions.push(configSub, formSub);
  }

  /**
   * Create reactive form
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['New Chart', Validators.required],
      description: [''],
      level: ['EQUIPMENT', Validators.required],
      chartType: ['line', Validators.required],
      timeRange: ['24h'],
      refreshInterval: [30000],
      realTimeEnabled: [true],
      maxDataPoints: [100],
      showLegend: [true],
      showDataLabels: [false],
      enableAnimation: [true]
    });
  }

  /**
   * Update form from configuration
   */
  private updateFormFromConfig(config: ChartConfiguration): void {
    this.configForm.patchValue({
      name: config.name,
      description: config.description || '',
      level: config.level,
      chartType: config.chartType,
      timeRange: config.timeRange || '24h',
      refreshInterval: config.refreshInterval || 30000,
      realTimeEnabled: config.realTime?.enabled || false,
      maxDataPoints: config.realTime?.maxDataPoints || 100,
      showLegend: config.chartOptions?.showLegend !== false,
      showDataLabels: config.chartOptions?.showDataLabels === true,
      enableAnimation: config.chartOptions?.enableAnimation !== false
    });

    // Update drag-drop fields
    this.updateDragDropFromConfig(config);
  }

  /**
   * Update configuration from form
   */
  private updateConfigFromForm(formValue: any): void {
    if (!this.currentConfig) return;

    const updatedConfig: Partial<ChartConfiguration> = {
      name: formValue.name,
      description: formValue.description,
      level: formValue.level,
      chartType: formValue.chartType,
      timeRange: formValue.timeRange,
      refreshInterval: formValue.refreshInterval,
      realTime: {
        enabled: formValue.realTimeEnabled,
        maxDataPoints: formValue.maxDataPoints
      },
      chartOptions: {
        ...this.currentConfig.chartOptions,
        showLegend: formValue.showLegend,
        showDataLabels: formValue.showDataLabels,
        enableAnimation: formValue.enableAnimation
      }
    };

    this.chartBuilderService.updateConfig(updatedConfig);
  }

  /**
   * Update field selections from configuration
   */
  private updateDragDropFromConfig(config: ChartConfiguration): void {
    // Clear all selections first
    this.clearAllFieldSelections();

    // Update chart type config
    this.currentChartTypeConfig = this.chartBuilderService.getChartTypeConfig(config.chartType);

    // Find axis fields (for axis-based charts)
    if (config.xAxis) {
      this.xAxisField = this.availableFields.find(f => f.field === config.xAxis!.field) || null;
    }
    if (config.yAxis) {
      this.yAxisField = this.availableFields.find(f => f.field === config.yAxis!.field) || null;
    }

    // Find special fields (for categorical/specialized charts)
    if (config.labelField) {
      this.labelField = this.availableFields.find(f => f.field === config.labelField!.field) || null;
    }
    if (config.valueField) {
      this.valueField = this.availableFields.find(f => f.field === config.valueField!.field) || null;
    }
    if (config.categoryField) {
      this.categoryField = this.availableFields.find(f => f.field === config.categoryField!.field) || null;
    }
    if (config.sizeField) {
      this.sizeField = this.availableFields.find(f => f.field === config.sizeField!.field) || null;
    }

    // Find series fields
    this.seriesFields = config.series.map(series =>
      this.availableFields.find(f => f.field === series.field)
    ).filter(f => f !== undefined) as FieldMapping[];
  }

  /**
   * Create new chart
   */
  createNewChart(): void {
    this.chartBuilderService.createNewChart();
  }

  /**
   * Handle level change
   */
  onLevelChange(level: string): void {
    this.selectedLevel = level;
    this.availableFields = this.chartBuilderService.getFieldsForLevel(level);
    this.filteredFields = [...this.availableFields];

    // Clear current drag-drop selections
    this.xAxisField = null;
    this.yAxisField = null;
    this.seriesFields = [];

    // Update configuration
    if (this.currentConfig) {
      this.chartBuilderService.updateConfig({ level: level as any });
    }
  }

  /**
   * Handle chart type change with intelligent field mapping
   */
  onChartTypeChange(chartType: string): void {
    const previousChartType = this.selectedChartType;
    const previousConfig = this.currentChartTypeConfig;

    this.selectedChartType = chartType;
    this.currentChartTypeConfig = this.chartBuilderService.getChartTypeConfig(chartType);

    if (!this.currentConfig) {
      // No existing config, create new
      this.chartBuilderService.createNewChart(chartType);
      return;
    }

    // Smart field mapping based on chart type transition
    this.handleChartTypeTransition(previousConfig, this.currentChartTypeConfig);

    // Update the chart configuration
    this.chartBuilderService.updateConfig({
      chartType: chartType as any,
      chartOptions: {
        ...this.currentConfig.chartOptions,
        multiSeries: this.currentChartTypeConfig?.supportsMultiSeries || false
      }
    });
  }

  /**
   * Handle intelligent field mapping when switching chart types
   */
  private handleChartTypeTransition(fromConfig: any, toConfig: any): void {
    if (!fromConfig || !toConfig || !this.currentConfig) return;

    const fromCategory = fromConfig.category;
    const toCategory = toConfig.category;

    // Case 1: Axis-based to Axis-based (line -> column, etc.)
    if (fromCategory === 'axis' && toCategory === 'axis') {
      // Keep all existing field mappings - they're compatible
      this.showTransitionMessage(`Switched to ${toConfig.label}. All field mappings preserved.`);
      return;
    }

    // Case 2: Axis-based to Categorical (line -> pie)
    if (fromCategory === 'axis' && toCategory === 'categorical') {
      // Map X-axis to label, Y-axis to value
      if (this.xAxisField) {
        this.labelField = this.xAxisField;
        this.updateSpecialFieldConfig('labelField', this.labelField);
      }
      if (this.yAxisField) {
        this.valueField = this.yAxisField;
        this.updateSpecialFieldConfig('valueField', this.valueField);
      }
      // Clear axis fields and series
      this.xAxisField = null;
      this.yAxisField = null;
      this.seriesFields = [];
      this.chartBuilderService.updateConfig({
        xAxis: undefined,
        yAxis: undefined,
        series: []
      });
      this.showTransitionMessage(`Switched to ${toConfig.label}. X-axis mapped to Label, Y-axis mapped to Value.`);
      return;
    }

    // Case 3: Categorical to Axis-based (pie -> line)
    if (fromCategory === 'categorical' && toCategory === 'axis') {
      // Map label to X-axis, value to Y-axis
      if (this.labelField) {
        this.xAxisField = this.labelField;
        this.updateAxisConfig('x', this.xAxisField);
      }
      if (this.valueField) {
        this.yAxisField = this.valueField;
        this.updateAxisConfig('y', this.valueField);
      }
      // Clear categorical fields
      this.labelField = null;
      this.valueField = null;
      this.chartBuilderService.updateConfig({
        labelField: undefined,
        valueField: undefined
      });
      this.showTransitionMessage(`Switched to ${toConfig.label}. Label mapped to X-axis, Value mapped to Y-axis.`);
      return;
    }

    // Case 4: Specialized charts - clear incompatible fields
    if (toCategory === 'specialized') {
      if (toConfig.type === 'gauge') {
        // Keep only value field for gauge
        if (this.yAxisField) {
          this.valueField = this.yAxisField;
          this.updateSpecialFieldConfig('valueField', this.valueField);
        } else if (this.valueField) {
          // Keep existing value field
        } else if (this.seriesFields.length > 0) {
          // Use first series as value
          this.valueField = this.seriesFields[0];
          this.updateSpecialFieldConfig('valueField', this.valueField);
        }
        this.clearIncompatibleFields(['valueField']);
        this.showTransitionMessage(`Switched to ${toConfig.label}. Using single value field.`);
      } else if (toConfig.type === 'heatmap') {
        // Map fields for heatmap
        if (this.xAxisField) {
          this.categoryField = this.xAxisField;
          this.updateSpecialFieldConfig('categoryField', this.categoryField);
        }
        if (this.yAxisField) {
          this.valueField = this.yAxisField;
          this.updateSpecialFieldConfig('valueField', this.valueField);
        }
        this.clearIncompatibleFields(['categoryField', 'valueField']);
        this.showTransitionMessage(`Switched to ${toConfig.label}. X-axis mapped to Category, Y-axis mapped to Value.`);
      }
      return;
    }

    // Case 5: From specialized to other types
    if (fromCategory === 'specialized') {
      if (toCategory === 'axis') {
        // Map value to Y-axis, create default X-axis
        if (this.valueField) {
          this.yAxisField = this.valueField;
          this.updateAxisConfig('y', this.yAxisField);
        }
        if (this.categoryField) {
          this.xAxisField = this.categoryField;
          this.updateAxisConfig('x', this.xAxisField);
        }
        this.clearIncompatibleFields(['xAxis', 'yAxis']);
        this.showTransitionMessage(`Switched to ${toConfig.label}. Value mapped to Y-axis.`);
      } else if (toCategory === 'categorical') {
        // Map category to label, value to value
        if (this.categoryField) {
          this.labelField = this.categoryField;
          this.updateSpecialFieldConfig('labelField', this.labelField);
        }
        if (this.valueField) {
          // Keep value field
          this.updateSpecialFieldConfig('valueField', this.valueField);
        }
        this.clearIncompatibleFields(['labelField', 'valueField']);
        this.showTransitionMessage(`Switched to ${toConfig.label}. Category mapped to Label.`);
      }
      return;
    }

    // Default case: clear all fields
    this.clearAllFieldSelections();
    this.showTransitionMessage(`Switched to ${toConfig.label}. Please reconfigure fields.`);
  }

  /**
   * Clear fields that are not compatible with current chart type
   */
  private clearIncompatibleFields(keepFields: string[]): void {
    const allFields = ['xAxisField', 'yAxisField', 'labelField', 'valueField', 'categoryField', 'sizeField'];

    allFields.forEach(fieldName => {
      const configField = fieldName.replace('Field', '');
      if (!keepFields.includes(configField)) {
        (this as any)[fieldName] = null;
      }
    });

    // Clear series if not supported
    if (!this.currentChartTypeConfig?.supportsMultiSeries) {
      this.seriesFields = [];
    }

    // Update configuration
    const updateObj: any = {};
    allFields.forEach(fieldName => {
      const configField = fieldName.replace('Field', '');
      if (!keepFields.includes(configField)) {
        updateObj[configField] = undefined;
      }
    });

    if (!this.currentChartTypeConfig?.supportsMultiSeries) {
      updateObj.series = [];
    }

    this.chartBuilderService.updateConfig(updateObj);
  }

  /**
   * Show transition message to user
   */
  private showTransitionMessage(message: string): void {
    // For now, just log - could be replaced with a snackbar or toast
    console.log('Chart Type Transition:', message);
    // TODO: Implement user notification (snackbar, toast, etc.)
  }

  /**
   * Clear all field selections
   */
  private clearAllFieldSelections(): void {
    this.xAxisField = null;
    this.yAxisField = null;
    this.labelField = null;
    this.valueField = null;
    this.categoryField = null;
    this.sizeField = null;
    this.seriesFields = [];
  }

  /**
   * Handle drag-drop events (temporarily disabled)
   */
  /*
  onFieldDrop(event: CdkDragDrop<FieldMapping[]>, target: 'xAxis' | 'yAxis' | 'series'): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const field = event.previousContainer.data[event.previousIndex];

      switch (target) {
        case 'xAxis':
          this.xAxisField = field;
          this.updateAxisConfig('x', field);
          break;
        case 'yAxis':
          this.yAxisField = field;
          this.updateAxisConfig('y', field);
          break;
        case 'series':
          if (!this.seriesFields.find(f => f.field === field.field)) {
            this.seriesFields.push(field);
            this.updateSeriesConfig();
          }
          break;
      }
    }
  }
  */

  /**
   * Select field for chart configuration (dynamic based on chart type)
   */
  selectField(field: FieldMapping, target: string): void {
    switch (target) {
      case 'xAxis':
        this.xAxisField = field;
        this.updateAxisConfig('x', field);
        break;
      case 'yAxis':
        this.yAxisField = field;
        this.updateAxisConfig('y', field);
        break;
      case 'labelField':
        this.labelField = field;
        this.updateSpecialFieldConfig('labelField', field);
        break;
      case 'valueField':
        this.valueField = field;
        this.updateSpecialFieldConfig('valueField', field);
        break;
      case 'categoryField':
        this.categoryField = field;
        this.updateSpecialFieldConfig('categoryField', field);
        break;
      case 'sizeField':
        this.sizeField = field;
        this.updateSpecialFieldConfig('sizeField', field);
        break;
      case 'series':
        this.addSeriesField(field);
        break;
    }
  }

  /**
   * Update axis configuration
   */
  private updateAxisConfig(axis: 'x' | 'y', field: FieldMapping): void {
    if (!this.currentConfig) return;

    const axisConfig = {
      field: field.field,
      label: field.label,
      type: field.type,
      unit: field.unit,
      aggregationType: field.type === 'number' ? 'AVERAGE' as const : undefined
    };

    if (axis === 'x') {
      this.chartBuilderService.updateConfig({ xAxis: axisConfig });
    } else {
      this.chartBuilderService.updateConfig({ yAxis: axisConfig });
    }
  }

  /**
   * Update special field configuration (for non-axis charts)
   */
  private updateSpecialFieldConfig(fieldType: string, field: FieldMapping): void {
    if (!this.currentConfig) return;

    const fieldConfig = {
      field: field.field,
      label: field.label,
      type: field.type,
      unit: field.unit,
      aggregationType: field.type === 'number' ? 'AVERAGE' as const : undefined
    };

    const updateObj: any = {};
    updateObj[fieldType] = fieldConfig;

    this.chartBuilderService.updateConfig(updateObj);
  }

  /**
   * Update series configuration with proper validation
   */
  private updateSeriesConfig(): void {
    if (!this.currentConfig) return;

    const series: ChartSeries[] = this.seriesFields.map((field, index) => ({
      name: field.label,
      field: field.field,
      aggregation: 'AVERAGE',
      color: this.getSeriesColor(index)
    }));

    console.log('Updating series configuration:', {
      seriesFieldsCount: this.seriesFields.length,
      seriesFields: this.seriesFields.map(f => ({ label: f.label, field: f.field })),
      generatedSeries: series
    });

    this.chartBuilderService.updateConfig({ series });

    // Update chart preview
    this.updateChartPreview();
  }

  /**
   * Get series color
   */
  getSeriesColor(index: number): string {
    const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f'];
    return colors[index % colors.length];
  }

  /**
   * Add series field with validation
   */
  addSeriesField(field: FieldMapping): void {
    if (!this.supportsMultiSeries) {
      this.showTransitionMessage('This chart type does not support multiple series.');
      return;
    }

    if (this.seriesFields.find(f => f.field === field.field)) {
      this.showTransitionMessage('This field is already added to the series.');
      return;
    }

    if (this.seriesFields.length >= 10) {
      this.showTransitionMessage('Maximum 10 series allowed.');
      return;
    }

    this.seriesFields.push(field);
    this.updateSeriesConfig();
    this.showTransitionMessage(`Added ${field.label} to data series.`);
  }

  /**
   * Remove series field
   */
  removeSeriesField(index: number): void {
    if (index >= 0 && index < this.seriesFields.length) {
      const removedField = this.seriesFields[index];
      this.seriesFields.splice(index, 1);
      this.updateSeriesConfig();
      this.showTransitionMessage(`Removed ${removedField.label} from data series.`);
    }
  }

  /**
   * Update chart preview
   */
  updateChartPreview(): void {
    if (this.currentConfig) {
      this.updateChart();
    }
  }

  /**
   * Update chart visualization
   */
  private updateChart(): void {
    if (!this.currentConfig) return;

    console.log('Updating chart with config:', {
      chartType: this.currentConfig.chartType,
      seriesCount: this.currentConfig.series?.length || 0,
      series: this.currentConfig.series?.map(s => ({ name: s.name, field: s.field })) || []
    });

    // Generate mock data for preview
    this.generateMockChartData();

    // Convert to chart configuration
    this.chartOptions = this.chartBuilderService.toChartConfig(this.currentConfig, this.chartData);

    console.log('Generated chart options:', {
      seriesCount: this.chartOptions?.series?.length || 0,
      seriesNames: this.chartOptions?.series?.map((s: any) => s.name) || []
    });
  }

  /**
   * Generate mock data for chart preview
   */
  private generateMockChartData(): void {
    const dataPoints = 20;
    this.chartData = [];

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(Date.now() - (dataPoints - i) * 60000);
      const dataPoint: any = {
        // Time field
        timestamp: timestamp.toISOString(),

        // Electrical fields
        'electrical.activePower': 1800 + Math.random() * 400,
        'electrical.voltage.l1': 690 + Math.random() * 20,
        'electrical.current.l1': 1800 + Math.random() * 200,
        'electrical.frequency': 49.8 + Math.random() * 0.4, // 49.8-50.2 Hz
        'electrical.energy.totalGeneration': 5000 + Math.random() * 2000,

        // Environmental fields
        'environmental.weather.windSpeed': 8 + Math.random() * 8,
        'environmental.weather.temperature.ambient': 25 + Math.random() * 10,
        'environmental.weather.humidity': 60 + Math.random() * 30,
        'environmental.solar.irradiance': 800 + Math.random() * 400,

        // Performance fields
        'performance.efficiency': 85 + Math.random() * 10,
        'performance.availability': 95 + Math.random() * 5,
        'performance.capacityFactor': 70 + Math.random() * 20,

        // Aggregated fields
        totalPower: 1500 + Math.random() * 500,
        avgEfficiency: 80 + Math.random() * 15,
        totalEquipment: 10 + Math.floor(Math.random() * 5),

        // Identity fields
        name: `Equipment ${i + 1}`,
        type: i % 2 === 0 ? 'Wind Turbine' : 'Solar Panel'
      };

      this.chartData.push(dataPoint);
    }

    console.log('Generated mock data with fields:', Object.keys(this.chartData[0]));
  }

  /**
   * Save chart configuration
   */
  saveChart(): void {
    if (!this.currentConfig) return;

    this.chartBuilderService.saveChart(this.currentConfig).subscribe({
      next: (result) => {
        console.log('Chart saved successfully:', result);
        // TODO: Show success message
      },
      error: (error) => {
        console.error('Error saving chart:', error);
        // TODO: Show error message
      }
    });
  }

  /**
   * Preview chart with real data
   */
  previewChart(): void {
    if (!this.currentConfig) return;

    this.isLoadingData = true;
    this.chartBuilderService.getChartData(this.currentConfig).subscribe({
      next: (data) => {
        this.chartData = data;
        this.updateChart();
        this.isLoadingData = false;
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
        this.isLoadingData = false;
        // Fall back to mock data
        this.generateMockChartData();
        this.updateChart();
      }
    });
  }

  /**
   * Get chart type options
   */
  get chartTypes() {
    return this.chartBuilderService.supportedChartTypes;
  }

  /**
   * Get data level options
   */
  get dataLevels() {
    return this.chartBuilderService.dataLevels;
  }

  /**
   * Filter fields by category
   */
  getFieldsByCategory(category: string): FieldMapping[] {
    return this.filteredFields.filter(field => field.category === category);
  }

  /**
   * Get unique categories
   */
  get fieldCategories(): string[] {
    const categories = [...new Set(this.filteredFields.map(field => field.category))];
    return categories.sort();
  }

  /**
   * Check if current chart type requires specific field
   */
  requiresField(fieldType: string): boolean {
    if (!this.currentChartTypeConfig) return false;
    return this.currentChartTypeConfig.requiredFields.primary.includes(fieldType) ||
      this.currentChartTypeConfig.requiredFields.secondary.includes(fieldType);
  }

  /**
   * Check if current chart type supports multi-series
   */
  get supportsMultiSeries(): boolean {
    return this.currentChartTypeConfig?.supportsMultiSeries || false;
  }

  /**
   * Get chart type category
   */
  get chartTypeCategory(): string {
    return this.currentChartTypeConfig?.category || 'axis';
  }

  /**
   * Get required field types for current chart
   */
  get requiredFields(): string[] {
    return this.currentChartTypeConfig?.requiredFields.primary || [];
  }

  /**
   * Get optional field types for current chart
   */
  get optionalFields(): string[] {
    return this.currentChartTypeConfig?.requiredFields.secondary || [];
  }

  /**
   * Check if current configuration is valid
   */
  get isConfigurationValid(): boolean {
    if (!this.currentChartTypeConfig) return false;

    const requiredFields = this.currentChartTypeConfig.requiredFields.primary;

    for (const fieldType of requiredFields) {
      switch (fieldType) {
        case 'xAxis':
          if (!this.xAxisField) return false;
          break;
        case 'yAxis':
          if (!this.yAxisField) return false;
          break;
        case 'labelField':
          if (!this.labelField) return false;
          break;
        case 'valueField':
          if (!this.valueField) return false;
          break;
        case 'categoryField':
          if (!this.categoryField) return false;
          break;
        case 'sizeField':
          if (!this.sizeField) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Get validation errors
   */
  get validationErrors(): string[] {
    const errors: string[] = [];

    if (!this.currentChartTypeConfig) {
      errors.push('No chart type selected');
      return errors;
    }

    const requiredFields = this.currentChartTypeConfig.requiredFields.primary;

    for (const fieldType of requiredFields) {
      switch (fieldType) {
        case 'xAxis':
          if (!this.xAxisField) errors.push('X-Axis field is required');
          break;
        case 'yAxis':
          if (!this.yAxisField) errors.push('Y-Axis field is required');
          break;
        case 'labelField':
          if (!this.labelField) errors.push('Label field is required');
          break;
        case 'valueField':
          if (!this.valueField) errors.push('Value field is required');
          break;
        case 'categoryField':
          if (!this.categoryField) errors.push('Category field is required');
          break;
        case 'sizeField':
          if (!this.sizeField) errors.push('Size field is required');
          break;
      }
    }

    return errors;
  }

  /**
   * Get configuration completeness percentage
   */
  get configurationCompleteness(): number {
    if (!this.currentChartTypeConfig) return 0;

    const requiredFields = this.currentChartTypeConfig.requiredFields.primary;
    if (requiredFields.length === 0) return 100;

    let completedFields = 0;

    for (const fieldType of requiredFields) {
      switch (fieldType) {
        case 'xAxis':
          if (this.xAxisField) completedFields++;
          break;
        case 'yAxis':
          if (this.yAxisField) completedFields++;
          break;
        case 'labelField':
          if (this.labelField) completedFields++;
          break;
        case 'valueField':
          if (this.valueField) completedFields++;
          break;
        case 'categoryField':
          if (this.categoryField) completedFields++;
          break;
        case 'sizeField':
          if (this.sizeField) completedFields++;
          break;
      }
    }

    return Math.round((completedFields / requiredFields.length) * 100);
  }
}
