import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-widget-container">
      <div #chartContainer class="chart-container"></div>
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>Loading chart...</span>
      </div>
      <div *ngIf="hasError" class="error-overlay">
        <span>Failed to load chart</span>
      </div>
    </div>
  `,
  styles: [`
    .chart-widget-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .chart-container {
      width: 100%;
      height: 100%;
    }

    .loading-overlay,
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      color: #666;
      font-size: 0.9rem;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-overlay {
      color: #f44336;
    }
  `]
})
export class ChartWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() chartConfig: any;
  @Input() chartId?: string;
  @Input() width?: number;
  @Input() height?: number;

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  private chart?: Highcharts.Chart;
  isLoading = false;
  hasError = false;

  ngOnInit(): void {
    console.log('ChartWidget initialized with config:', this.chartConfig);
  }

  ngAfterViewInit(): void {
    if (this.chartConfig) {
      this.renderChart();
    } else {
      this.hasError = true;
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private renderChart(): void {
    try {
      this.isLoading = true;
      this.hasError = false;

      // Prepare chart configuration
      const chartOptions = this.prepareChartOptions();
      
      // Create the chart
      this.chart = Highcharts.chart(this.chartContainer.nativeElement, chartOptions);
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error rendering chart:', error);
      this.isLoading = false;
      this.hasError = true;
    }
  }

  private prepareChartOptions(): Highcharts.Options {
    // Default chart configuration
    const defaultOptions: Highcharts.Options = {
      chart: {
        type: this.chartConfig.chartType || 'line',
        height: this.height || 300,
        backgroundColor: 'transparent',
        animation: false
      },
      title: {
        text: this.chartConfig.title || '',
        style: {
          fontSize: '14px',
          fontWeight: '500'
        }
      },
      credits: {
        enabled: false
      },
      legend: {
        enabled: this.chartConfig.showLegend !== false,
        align: 'center',
        verticalAlign: 'bottom'
      },
      xAxis: {
        title: {
          text: this.chartConfig.xAxis?.label || ''
        },
        type: this.chartConfig.xAxis?.type === 'datetime' ? 'datetime' : 'linear'
      },
      yAxis: {
        title: {
          text: this.chartConfig.yAxis?.label || ''
        },
        gridLineWidth: this.chartConfig.showGrid !== false ? 1 : 0
      },
      plotOptions: {
        series: {
          animation: false,
          marker: {
            radius: 3
          }
        }
      },
      series: this.prepareSeries(),
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              enabled: false
            }
          }
        }]
      }
    };

    // Merge with any additional configuration from chartConfig
    if (this.chartConfig.highchartsConfig) {
      return this.deepMerge(defaultOptions, this.chartConfig.highchartsConfig);
    }

    return defaultOptions;
  }

  private prepareSeries(): Highcharts.SeriesOptionsType[] {
    // If we have series data in the config, use it
    if (this.chartConfig.series && Array.isArray(this.chartConfig.series)) {
      return this.chartConfig.series;
    }

    // Generate sample data based on chart type
    return this.generateSampleData();
  }

  private generateSampleData(): Highcharts.SeriesOptionsType[] {
    const chartType = this.chartConfig.chartType || 'line';
    
    switch (chartType) {
      case 'pie':
        return [{
          type: 'pie',
          name: 'Energy Distribution',
          data: [
            { name: 'Solar', y: 45.2 },
            { name: 'Wind', y: 32.8 },
            { name: 'Hydro', y: 22.0 }
          ]
        }];
        
      case 'column':
      case 'bar':
        return [{
          type: chartType as any,
          name: 'Power Generation',
          data: [120, 135, 145, 160, 155, 140, 130]
        }];
        
      default: // line, area, spline
        return [{
          type: chartType as any,
          name: 'Active Power',
          data: this.generateTimeSeriesData()
        }];
    }
  }

  private generateTimeSeriesData(): [number, number][] {
    const data: [number, number][] = [];
    const now = Date.now();
    
    for (let i = 0; i < 24; i++) {
      const timestamp = now - (23 - i) * 60 * 60 * 1000; // Last 24 hours
      const value = 1800 + Math.random() * 400; // Random power values
      data.push([timestamp, value]);
    }
    
    return data;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Public method to update chart data
  updateChart(newConfig: any): void {
    this.chartConfig = newConfig;
    if (this.chart) {
      this.chart.destroy();
    }
    this.renderChart();
  }

  // Public method to resize chart
  resizeChart(): void {
    if (this.chart) {
      setTimeout(() => {
        this.chart?.reflow();
      }, 100);
    }
  }
}
