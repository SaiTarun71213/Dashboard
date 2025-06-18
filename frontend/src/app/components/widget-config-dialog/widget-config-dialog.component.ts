import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DashboardWidget } from '../dashboard-designer/dashboard-designer.component';

export interface WidgetConfigData {
  widget: DashboardWidget;
  availableFields: string[];
  availableCharts: any[];
}

@Component({
  selector: 'app-widget-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatSlideToggleModule
  ],
  templateUrl: './widget-config-dialog.component.html',
  styleUrl: './widget-config-dialog.component.scss'
})
export class WidgetConfigDialogComponent implements OnInit {
  configForm: FormGroup;
  widget: DashboardWidget;
  availableFields: string[] = [];
  availableCharts: any[] = [];

  // Field options for energy dashboard
  energyFields = [
    { value: 'electrical.activePower', label: 'Active Power (kW)', type: 'number' },
    { value: 'electrical.reactivePower', label: 'Reactive Power (kVAR)', type: 'number' },
    { value: 'electrical.voltage.l1', label: 'Voltage L1 (V)', type: 'number' },
    { value: 'electrical.voltage.l2', label: 'Voltage L2 (V)', type: 'number' },
    { value: 'electrical.voltage.l3', label: 'Voltage L3 (V)', type: 'number' },
    { value: 'electrical.current.l1', label: 'Current L1 (A)', type: 'number' },
    { value: 'electrical.current.l2', label: 'Current L2 (A)', type: 'number' },
    { value: 'electrical.current.l3', label: 'Current L3 (A)', type: 'number' },
    { value: 'electrical.frequency', label: 'Frequency (Hz)', type: 'number' },
    { value: 'electrical.totalEnergy', label: 'Total Energy (kWh)', type: 'number' },
    { value: 'performance.efficiency', label: 'Efficiency (%)', type: 'number' },
    { value: 'performance.capacity', label: 'Capacity Factor (%)', type: 'number' },
    { value: 'environmental.temperature', label: 'Temperature (°C)', type: 'number' },
    { value: 'environmental.humidity', label: 'Humidity (%)', type: 'number' },
    { value: 'environmental.windSpeed', label: 'Wind Speed (m/s)', type: 'number' },
    { value: 'environmental.solarIrradiance', label: 'Solar Irradiance (W/m²)', type: 'number' },
    { value: 'status.operational', label: 'Operational Status', type: 'string' },
    { value: 'status.alarmCount', label: 'Alarm Count', type: 'number' },
    { value: 'timestamp', label: 'Timestamp', type: 'datetime' }
  ];

  chartTypes = [
    { value: 'line', label: 'Line Chart', icon: 'show_chart' },
    { value: 'bar', label: 'Bar Chart', icon: 'bar_chart' },
    { value: 'column', label: 'Column Chart', icon: 'bar_chart' },
    { value: 'area', label: 'Area Chart', icon: 'area_chart' },
    { value: 'pie', label: 'Pie Chart', icon: 'pie_chart' },
    { value: 'scatter', label: 'Scatter Plot', icon: 'scatter_plot' },
    { value: 'bubble', label: 'Bubble Chart', icon: 'bubble_chart' }
  ];

  aggregationTypes = [
    { value: 'SUM', label: 'Sum' },
    { value: 'AVERAGE', label: 'Average' },
    { value: 'MIN', label: 'Minimum' },
    { value: 'MAX', label: 'Maximum' },
    { value: 'COUNT', label: 'Count' },
    { value: 'LAST', label: 'Last Value' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WidgetConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WidgetConfigData
  ) {
    this.widget = { ...data.widget };
    this.availableFields = data.availableFields || [];
    this.availableCharts = data.availableCharts || [];
    this.configForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadWidgetConfig();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      
      // Metric widget config
      metricField: [''],
      metricLabel: [''],
      metricUnit: [''],
      metricAggregation: ['SUM'],
      
      // Chart widget config
      chartType: ['line'],
      xAxisField: ['timestamp'],
      yAxisField: [''],
      xAxisLabel: [''],
      yAxisLabel: [''],
      
      // Table widget config
      tableColumns: [[]],
      tableSortBy: [''],
      tablePageSize: [10],
      
      // General config
      refreshInterval: [60], // seconds
      showLegend: [true],
      showGrid: [true]
    });
  }

  private loadWidgetConfig(): void {
    // Load existing widget configuration
    this.configForm.patchValue({
      title: this.widget.title
    });

    // Load type-specific configuration
    switch (this.widget.type) {
      case 'metric':
        if (this.widget.config.metric) {
          this.configForm.patchValue({
            metricField: this.widget.config.metric.field,
            metricLabel: this.widget.config.metric.label,
            metricUnit: this.widget.config.metric.unit,
            metricAggregation: this.widget.config.metric.aggregation
          });
        }
        break;
        
      case 'chart':
        this.configForm.patchValue({
          chartType: this.widget.config.chartType || 'line',
          xAxisField: this.widget.config.xAxis?.field || 'timestamp',
          yAxisField: this.widget.config.yAxis?.field || '',
          xAxisLabel: this.widget.config.xAxis?.label || '',
          yAxisLabel: this.widget.config.yAxis?.label || '',
          showLegend: this.widget.config.showLegend !== false,
          showGrid: this.widget.config.showGrid !== false
        });
        break;
        
      case 'table':
        this.configForm.patchValue({
          tableColumns: this.widget.config.columns || [],
          tableSortBy: this.widget.config.sortBy || '',
          tablePageSize: this.widget.config.pageSize || 10
        });
        break;
    }
  }

  onSave(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      
      // Update widget title
      this.widget.title = formValue.title;
      
      // Update type-specific configuration
      switch (this.widget.type) {
        case 'metric':
          this.widget.config = {
            ...this.widget.config,
            metric: {
              field: formValue.metricField,
              label: formValue.metricLabel,
              unit: formValue.metricUnit,
              aggregation: formValue.metricAggregation
            }
          };
          break;
          
        case 'chart':
          this.widget.config = {
            ...this.widget.config,
            chartType: formValue.chartType,
            xAxis: {
              field: formValue.xAxisField,
              label: formValue.xAxisLabel,
              type: formValue.xAxisField === 'timestamp' ? 'datetime' : 'number'
            },
            yAxis: {
              field: formValue.yAxisField,
              label: formValue.yAxisLabel,
              type: 'number'
            },
            showLegend: formValue.showLegend,
            showGrid: formValue.showGrid
          };
          break;
          
        case 'table':
          this.widget.config = {
            ...this.widget.config,
            columns: formValue.tableColumns,
            sortBy: formValue.tableSortBy,
            pageSize: formValue.tablePageSize
          };
          break;
      }
      
      this.dialogRef.close(this.widget);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldLabel(fieldValue: string): string {
    const field = this.energyFields.find(f => f.value === fieldValue);
    return field ? field.label : fieldValue;
  }
}
