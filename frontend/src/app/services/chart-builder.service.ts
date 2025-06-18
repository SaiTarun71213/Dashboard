import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Highcharts from 'highcharts';

/**
 * CHART BUILDER SERVICE
 * Handles chart creation, configuration, and chart library integration
 */

export interface ChartParameter {
  field: string;
  label: string;
  type: 'string' | 'number' | 'datetime' | 'category';
  unit?: string;
  aggregationType?: 'SUM' | 'AVERAGE' | 'MAX' | 'MIN' | 'COUNT';
}

export interface ChartSeries {
  name: string;
  field: string;
  aggregation: 'SUM' | 'AVERAGE' | 'MAX' | 'MIN' | 'COUNT';
  color?: string;
  yAxis?: number;
}

export interface ChartConfiguration {
  id?: string;
  name: string;
  description?: string;
  level: 'SECTOR' | 'STATE' | 'PLANT' | 'EQUIPMENT';
  chartType: 'line' | 'spline' | 'area' | 'areaspline' | 'column' | 'bar' | 'pie' | 'scatter' | 'bubble' | 'gauge' | 'heatmap';
  // Dynamic configuration based on chart type
  xAxis?: ChartParameter;  // For axis-based charts
  yAxis?: ChartParameter;  // For axis-based charts
  labelField?: ChartParameter;  // For pie charts, gauge charts
  valueField?: ChartParameter;  // For pie charts, gauge charts
  categoryField?: ChartParameter;  // For heatmaps
  sizeField?: ChartParameter;  // For bubble charts
  series: ChartSeries[];
  timeRange?: string;
  refreshInterval?: number;
  realTime?: {
    enabled: boolean;
    maxDataPoints: number;
  };
  chartOptions?: {
    colors?: string[];
    showLegend?: boolean;
    showDataLabels?: boolean;
    enableAnimation?: boolean;
    multiSeries?: boolean;  // Support for multiple series
  };
  filters?: any;
  tags?: string[];
}

export interface ChartTypeConfig {
  type: string;
  label: string;
  icon: string;
  category: 'axis' | 'categorical' | 'specialized';
  requiredFields: {
    primary: string[];  // Required fields (e.g., ['xAxis', 'yAxis'] or ['labelField', 'valueField'])
    secondary: string[];  // Optional fields
  };
  supportsMultiSeries: boolean;
  description: string;
}

export interface FieldMapping {
  field: string;
  label: string;
  type: 'string' | 'number' | 'datetime' | 'category';
  unit?: string;
  category: string;
  level: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChartBuilderService {
  private readonly apiUrl = 'http://localhost:3000/api';

  // Chart configuration state
  private currentConfigSubject = new BehaviorSubject<ChartConfiguration | null>(null);
  public currentConfig$ = this.currentConfigSubject.asObservable();

  // Available fields for drag-drop
  private availableFieldsSubject = new BehaviorSubject<FieldMapping[]>([]);
  public availableFields$ = this.availableFieldsSubject.asObservable();

  // Chart types with detailed configuration
  public readonly supportedChartTypes: ChartTypeConfig[] = [
    // Axis-based charts
    {
      type: 'line',
      label: 'Line Chart',
      icon: 'show_chart',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Best for showing trends over time or continuous data'
    },
    {
      type: 'spline',
      label: 'Spline Chart',
      icon: 'timeline',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Smooth curved line chart for trend visualization'
    },
    {
      type: 'area',
      label: 'Area Chart',
      icon: 'area_chart',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Shows volume and trends with filled areas'
    },
    {
      type: 'column',
      label: 'Column Chart',
      icon: 'bar_chart',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Vertical bars for comparing categories'
    },
    {
      type: 'bar',
      label: 'Bar Chart',
      icon: 'bar_chart',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Horizontal bars for comparing categories'
    },
    {
      type: 'scatter',
      label: 'Scatter Plot',
      icon: 'scatter_plot',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Shows correlation between two variables'
    },
    {
      type: 'bubble',
      label: 'Bubble Chart',
      icon: 'bubble_chart',
      category: 'axis',
      requiredFields: { primary: ['xAxis', 'yAxis', 'sizeField'], secondary: ['series'] },
      supportsMultiSeries: true,
      description: 'Three-dimensional data with bubble sizes'
    },
    // Categorical charts
    {
      type: 'pie',
      label: 'Pie Chart',
      icon: 'pie_chart',
      category: 'categorical',
      requiredFields: { primary: ['labelField', 'valueField'], secondary: [] },
      supportsMultiSeries: false,
      description: 'Shows parts of a whole as percentages'
    },
    // Specialized charts
    {
      type: 'gauge',
      label: 'Gauge Chart',
      icon: 'speed',
      category: 'specialized',
      requiredFields: { primary: ['valueField'], secondary: [] },
      supportsMultiSeries: false,
      description: 'Single value display with ranges'
    },
    {
      type: 'heatmap',
      label: 'Heatmap',
      icon: 'grid_on',
      category: 'specialized',
      requiredFields: { primary: ['categoryField', 'valueField'], secondary: [] },
      supportsMultiSeries: false,
      description: 'Color-coded matrix for pattern visualization'
    }
  ];

  // Data levels
  public readonly dataLevels = [
    { value: 'SECTOR', label: 'Sector Level', icon: 'public' },
    { value: 'STATE', label: 'State Level', icon: 'map' },
    { value: 'PLANT', label: 'Plant Level', icon: 'factory' },
    { value: 'EQUIPMENT', label: 'Equipment Level', icon: 'precision_manufacturing' }
  ];

  constructor(private http: HttpClient) {
    this.initializeFieldMappings();
  }

  /**
   * Initialize field mappings for drag-drop
   */
  private initializeFieldMappings(): void {
    const fieldMappings: FieldMapping[] = [
      // Timestamp fields
      { field: 'timestamp', label: 'Time', type: 'datetime', category: 'Time', level: ['EQUIPMENT', 'PLANT', 'STATE', 'SECTOR'] },

      // Electrical fields
      { field: 'electrical.activePower', label: 'Active Power', type: 'number', unit: 'kW', category: 'Electrical', level: ['EQUIPMENT'] },
      { field: 'electrical.voltage.l1', label: 'Voltage L1', type: 'number', unit: 'V', category: 'Electrical', level: ['EQUIPMENT'] },
      { field: 'electrical.current.l1', label: 'Current L1', type: 'number', unit: 'A', category: 'Electrical', level: ['EQUIPMENT'] },
      { field: 'electrical.frequency', label: 'Frequency', type: 'number', unit: 'Hz', category: 'Electrical', level: ['EQUIPMENT'] },
      { field: 'electrical.energy.totalGeneration', label: 'Total Energy', type: 'number', unit: 'kWh', category: 'Electrical', level: ['EQUIPMENT'] },

      // Environmental fields
      { field: 'environmental.weather.windSpeed', label: 'Wind Speed', type: 'number', unit: 'm/s', category: 'Environmental', level: ['EQUIPMENT'] },
      { field: 'environmental.weather.temperature.ambient', label: 'Ambient Temperature', type: 'number', unit: '°C', category: 'Environmental', level: ['EQUIPMENT'] },
      { field: 'environmental.weather.humidity', label: 'Humidity', type: 'number', unit: '%', category: 'Environmental', level: ['EQUIPMENT'] },
      { field: 'environmental.solar.irradiance', label: 'Solar Irradiance', type: 'number', unit: 'W/m²', category: 'Environmental', level: ['EQUIPMENT'] },

      // Performance fields
      { field: 'performance.efficiency', label: 'Efficiency', type: 'number', unit: '%', category: 'Performance', level: ['EQUIPMENT', 'PLANT', 'STATE'] },
      { field: 'performance.availability', label: 'Availability', type: 'number', unit: '%', category: 'Performance', level: ['EQUIPMENT', 'PLANT', 'STATE'] },
      { field: 'performance.capacityFactor', label: 'Capacity Factor', type: 'number', unit: '%', category: 'Performance', level: ['EQUIPMENT', 'PLANT'] },

      // Plant/State aggregated fields
      { field: 'totalPower', label: 'Total Power', type: 'number', unit: 'MW', category: 'Aggregated', level: ['PLANT', 'STATE', 'SECTOR'] },
      { field: 'avgEfficiency', label: 'Average Efficiency', type: 'number', unit: '%', category: 'Aggregated', level: ['PLANT', 'STATE', 'SECTOR'] },
      { field: 'totalEquipment', label: 'Equipment Count', type: 'number', category: 'Aggregated', level: ['PLANT', 'STATE', 'SECTOR'] },
      { field: 'name', label: 'Name', type: 'category', category: 'Identity', level: ['PLANT', 'STATE'] },
      { field: 'type', label: 'Type', type: 'category', category: 'Identity', level: ['PLANT', 'EQUIPMENT'] }
    ];

    this.availableFieldsSubject.next(fieldMappings);
  }

  /**
   * Get available fields for a specific level
   */
  getFieldsForLevel(level: string): FieldMapping[] {
    return this.availableFieldsSubject.value.filter(field =>
      field.level.includes(level)
    );
  }

  /**
   * Get chart type configuration
   */
  getChartTypeConfig(chartType: string): ChartTypeConfig | undefined {
    return this.supportedChartTypes.find(type => type.type === chartType);
  }

  /**
   * Create new chart configuration based on chart type
   */
  createNewChart(chartType: string = 'line'): ChartConfiguration {
    const typeConfig = this.getChartTypeConfig(chartType);

    const baseConfig: ChartConfiguration = {
      name: 'New Chart',
      level: 'EQUIPMENT',
      chartType: chartType as any,
      series: [],
      timeRange: '24h',
      refreshInterval: 30000,
      realTime: {
        enabled: true,
        maxDataPoints: 100
      },
      chartOptions: {
        colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9'],
        showLegend: true,
        showDataLabels: false,
        enableAnimation: true,
        multiSeries: typeConfig?.supportsMultiSeries || false
      }
    };

    // Configure fields based on chart type
    if (typeConfig?.category === 'axis') {
      // Axis-based charts (line, column, bar, etc.)
      baseConfig.xAxis = {
        field: 'timestamp',
        label: 'Time',
        type: 'datetime'
      };
      baseConfig.yAxis = {
        field: 'electrical.activePower',
        label: 'Active Power',
        type: 'number',
        unit: 'kW',
        aggregationType: 'AVERAGE'
      };
      baseConfig.series = [{
        name: 'Active Power',
        field: 'electrical.activePower',
        aggregation: 'AVERAGE',
        color: '#7cb5ec'
      }];
    } else if (typeConfig?.category === 'categorical') {
      // Categorical charts (pie, donut)
      baseConfig.labelField = {
        field: 'name',
        label: 'Category',
        type: 'category'
      };
      baseConfig.valueField = {
        field: 'electrical.activePower',
        label: 'Active Power',
        type: 'number',
        unit: 'kW',
        aggregationType: 'SUM'
      };
    } else if (typeConfig?.category === 'specialized') {
      // Specialized charts (gauge, heatmap)
      if (chartType === 'gauge') {
        baseConfig.valueField = {
          field: 'electrical.activePower',
          label: 'Active Power',
          type: 'number',
          unit: 'kW',
          aggregationType: 'AVERAGE'
        };
      } else if (chartType === 'heatmap') {
        baseConfig.categoryField = {
          field: 'name',
          label: 'Category',
          type: 'category'
        };
        baseConfig.valueField = {
          field: 'electrical.activePower',
          label: 'Active Power',
          type: 'number',
          unit: 'kW',
          aggregationType: 'AVERAGE'
        };
      }
    }

    this.currentConfigSubject.next(baseConfig);
    return baseConfig;
  }

  /**
   * Update current chart configuration
   */
  updateConfig(config: Partial<ChartConfiguration>): void {
    const current = this.currentConfigSubject.value;
    if (current) {
      const updated = { ...current, ...config };
      this.currentConfigSubject.next(updated);
    }
  }

  /**
   * Save chart configuration
   */
  saveChart(config: ChartConfiguration): Observable<any> {
    if (config.id) {
      return this.http.put(`${this.apiUrl}/chart-builder/charts/${config.id}`, config);
    } else {
      return this.http.post(`${this.apiUrl}/chart-builder/charts`, config);
    }
  }

  /**
   * Load chart configuration
   */
  loadChart(id: string): Observable<ChartConfiguration> {
    return this.http.get<ChartConfiguration>(`${this.apiUrl}/charts/${id}`);
  }

  /**
   * Get chart data for preview
   */
  getChartData(config: ChartConfiguration, options: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/charts/data`, { config, options });
  }

  /**
   * Convert configuration to chart options based on chart type
   */
  toChartConfig(config: ChartConfiguration, data: any[]): any {
    const typeConfig = this.getChartTypeConfig(config.chartType);

    const baseConfig: any = {
      chart: {
        type: config.chartType as any,
        animation: config.chartOptions?.enableAnimation !== false
      },
      title: {
        text: config.name
      },
      legend: {
        enabled: config.chartOptions?.showLegend !== false
      },
      colors: config.chartOptions?.colors || ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9'],
      plotOptions: {
        series: {
          dataLabels: {
            enabled: config.chartOptions?.showDataLabels === true
          }
        }
      }
    };

    // Configure based on chart category
    if (typeConfig?.category === 'axis') {
      // Axis-based charts
      if (config.xAxis) {
        baseConfig.xAxis = {
          title: {
            text: `${config.xAxis.label}${config.xAxis.unit ? ` (${config.xAxis.unit})` : ''}`
          },
          type: config.xAxis.type === 'datetime' ? 'datetime' : 'category'
        };
      }

      if (config.yAxis) {
        baseConfig.yAxis = {
          title: {
            text: `${config.yAxis.label}${config.yAxis.unit ? ` (${config.yAxis.unit})` : ''}`
          }
        };
      }

      baseConfig.series = this.formatAxisSeriesData(config, data);

    } else if (typeConfig?.category === 'categorical') {
      // Categorical charts (pie)
      baseConfig.series = this.formatCategoricalSeriesData(config, data);

      if (config.chartType === 'pie') {
        baseConfig.plotOptions.pie = {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: config.chartOptions?.showDataLabels !== false,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          },
          showInLegend: config.chartOptions?.showLegend !== false
        };
      }

    } else if (typeConfig?.category === 'specialized') {
      // Specialized charts
      if (config.chartType === 'gauge') {
        baseConfig.series = this.formatGaugeSeriesData(config, data);
        baseConfig.pane = {
          startAngle: -90,
          endAngle: 89.9,
          background: null,
          center: ['50%', '75%'],
          size: '110%'
        };
      } else if (config.chartType === 'heatmap') {
        baseConfig.series = this.formatHeatmapSeriesData(config, data);
        baseConfig.colorAxis = {
          min: 0,
          minColor: '#FFFFFF',
          maxColor: '#1976d2'
        };
      }
    }

    return baseConfig;
  }

  /**
   * Format data for axis-based charts (line, column, bar, etc.)
   */
  private formatAxisSeriesData(config: ChartConfiguration, data: any[]): any[] {
    if (!config.xAxis || !config.yAxis) {
      console.warn('Missing axis configuration:', { xAxis: !!config.xAxis, yAxis: !!config.yAxis });
      return [];
    }

    console.log('Formatting axis series data:', {
      seriesCount: config.series.length,
      dataPoints: data.length,
      xAxisField: config.xAxis.field,
      yAxisField: config.yAxis.field,
      seriesFields: config.series.map(s => s.field)
    });

    // If no series configured, create default series from Y-axis
    if (config.series.length === 0) {
      const defaultSeries = [{
        name: config.yAxis.label,
        type: config.chartType as any,
        color: '#7cb5ec',
        data: data.map(point => ({
          x: config.xAxis!.type === 'datetime' ? new Date(point[config.xAxis!.field]).getTime() : point[config.xAxis!.field],
          y: point[config.yAxis!.field] || 0
        }))
      }];
      console.log('Created default series:', defaultSeries[0].name, 'with', defaultSeries[0].data.length, 'points');
      return defaultSeries;
    }

    // Format multiple series
    const formattedSeries = config.series.map((seriesConfig, index) => {
      const seriesData = data.map(point => ({
        x: config.xAxis!.type === 'datetime' ? new Date(point[config.xAxis!.field]).getTime() : point[config.xAxis!.field],
        y: point[seriesConfig.field] || 0
      }));

      const series = {
        name: seriesConfig.name,
        type: config.chartType as any,
        color: seriesConfig.color || this.getDefaultSeriesColor(index),
        data: seriesData
      };

      console.log(`Series ${index + 1}: ${series.name} (${seriesConfig.field}) - ${series.data.length} points, sample Y values:`,
        series.data.slice(0, 3).map(d => d.y));

      return series;
    });

    console.log('Total formatted series:', formattedSeries.length);
    return formattedSeries;
  }

  /**
   * Get default series color
   */
  private getDefaultSeriesColor(index: number): string {
    const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'];
    return colors[index % colors.length];
  }

  /**
   * Format data for categorical charts (pie)
   */
  private formatCategoricalSeriesData(config: ChartConfiguration, data: any[]): any[] {
    if (!config.labelField || !config.valueField) return [];

    const seriesData = data.map(point => ({
      name: point[config.labelField!.field] || 'Unknown',
      y: point[config.valueField!.field] || 0
    }));

    return [{
      name: config.valueField.label,
      type: config.chartType as any,
      data: seriesData
    }];
  }

  /**
   * Format data for gauge charts
   */
  private formatGaugeSeriesData(config: ChartConfiguration, data: any[]): any[] {
    if (!config.valueField || data.length === 0) return [];

    const value = data[data.length - 1][config.valueField.field] || 0;

    return [{
      name: config.valueField.label,
      type: 'gauge',
      data: [value],
      dial: {
        radius: '80%',
        backgroundColor: 'silver',
        baseWidth: 12,
        baseLength: '0%',
        rearLength: '0%'
      },
      pivot: {
        backgroundColor: 'silver',
        radius: 6
      }
    }];
  }

  /**
   * Format data for heatmap charts
   */
  private formatHeatmapSeriesData(config: ChartConfiguration, data: any[]): any[] {
    if (!config.categoryField || !config.valueField) return [];

    const seriesData = data.map((point, index) => [
      index % 7, // x coordinate (day of week)
      Math.floor(index / 7), // y coordinate (week)
      point[config.valueField!.field] || 0
    ]);

    return [{
      name: config.valueField.label,
      type: 'heatmap',
      data: seriesData,
      dataLabels: {
        enabled: true,
        color: '#000000'
      }
    }];
  }

  /**
   * Legacy format method for backward compatibility
   */
  private formatSeriesData(config: ChartConfiguration, data: any[]): any[] {
    return this.formatAxisSeriesData(config, data);
  }

  /**
   * Get chart templates
   */
  getChartTemplates(): Observable<ChartConfiguration[]> {
    return this.http.get<ChartConfiguration[]>(`${this.apiUrl}/charts/templates`);
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): ChartConfiguration | null {
    return this.currentConfigSubject.value;
  }
}
