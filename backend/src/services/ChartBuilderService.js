const ChartConfiguration = require('../models/ChartConfiguration');
const aggregationEngine = require('./AggregationEngine');
const { Equipment, Plant, State, Reading } = require('../models');

/**
 * CHART BUILDER SERVICE
 * Handles drag-and-drop chart creation, data retrieval, and Highcharts configuration
 * Provides dynamic field discovery and chart template management
 */

class ChartBuilderService {
    constructor() {
        this.supportedChartTypes = [
            'line', 'spline', 'area', 'areaspline', 'column', 'bar',
            'pie', 'scatter', 'bubble', 'gauge', 'solidgauge',
            'heatmap', 'treemap', 'funnel', 'pyramid'
        ];
        
        this.fieldMappings = this.initializeFieldMappings();
        this.chartTemplates = this.initializeChartTemplates();
    }

    /**
     * Initialize field mappings for different data levels
     */
    initializeFieldMappings() {
        return {
            EQUIPMENT: {
                electrical: {
                    'electrical.activePower': { label: 'Active Power', unit: 'kW', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.reactivePower': { label: 'Reactive Power', unit: 'kVAR', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.voltage.l1': { label: 'Voltage L1', unit: 'V', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.voltage.l2': { label: 'Voltage L2', unit: 'V', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.voltage.l3': { label: 'Voltage L3', unit: 'V', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.current.l1': { label: 'Current L1', unit: 'A', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.frequency': { label: 'Frequency', unit: 'Hz', type: 'number', aggregation: 'AVERAGE' },
                    'electrical.energy.totalGeneration': { label: 'Total Energy', unit: 'kWh', type: 'number', aggregation: 'SUM' }
                },
                performance: {
                    'performance.efficiency': { label: 'Efficiency', unit: '%', type: 'number', aggregation: 'AVERAGE' },
                    'performance.availability': { label: 'Availability', unit: '%', type: 'number', aggregation: 'AVERAGE' },
                    'performance.capacityFactor': { label: 'Capacity Factor', unit: '%', type: 'number', aggregation: 'AVERAGE' }
                },
                environmental: {
                    'environmental.weather.temperature.ambient': { label: 'Ambient Temperature', unit: '°C', type: 'number', aggregation: 'AVERAGE' },
                    'environmental.weather.humidity': { label: 'Humidity', unit: '%', type: 'number', aggregation: 'AVERAGE' },
                    'environmental.weather.solarIrradiance': { label: 'Solar Irradiance', unit: 'W/m²', type: 'number', aggregation: 'AVERAGE' },
                    'environmental.weather.windSpeed': { label: 'Wind Speed', unit: 'm/s', type: 'number', aggregation: 'AVERAGE' },
                    'environmental.weather.windDirection': { label: 'Wind Direction', unit: '°', type: 'number', aggregation: 'AVERAGE' }
                },
                temporal: {
                    'timestamp': { label: 'Timestamp', unit: '', type: 'datetime', aggregation: 'LATEST' },
                    'hour': { label: 'Hour', unit: '', type: 'number', aggregation: 'LATEST' },
                    'day': { label: 'Day', unit: '', type: 'number', aggregation: 'LATEST' },
                    'month': { label: 'Month', unit: '', type: 'number', aggregation: 'LATEST' }
                }
            },
            PLANT: {
                aggregated: {
                    'totalPower': { label: 'Total Power', unit: 'kW', type: 'number', aggregation: 'SUM' },
                    'avgEfficiency': { label: 'Average Efficiency', unit: '%', type: 'number', aggregation: 'AVERAGE' },
                    'equipmentCount': { label: 'Equipment Count', unit: '', type: 'number', aggregation: 'COUNT' },
                    'operationalCount': { label: 'Operational Equipment', unit: '', type: 'number', aggregation: 'COUNT' }
                }
            },
            STATE: {
                aggregated: {
                    'totalPower': { label: 'Total Power', unit: 'MW', type: 'number', aggregation: 'SUM' },
                    'plantCount': { label: 'Plant Count', unit: '', type: 'number', aggregation: 'COUNT' },
                    'totalEquipment': { label: 'Total Equipment', unit: '', type: 'number', aggregation: 'COUNT' }
                }
            },
            SECTOR: {
                aggregated: {
                    'totalPower': { label: 'Total Power', unit: 'GW', type: 'number', aggregation: 'SUM' },
                    'stateCount': { label: 'State Count', unit: '', type: 'number', aggregation: 'COUNT' },
                    'totalPlants': { label: 'Total Plants', unit: '', type: 'number', aggregation: 'COUNT' }
                }
            }
        };
    }

    /**
     * Initialize chart templates for quick creation
     */
    initializeChartTemplates() {
        return {
            powerTrend: {
                name: 'Power Generation Trend',
                chartType: 'line',
                level: 'EQUIPMENT',
                xAxis: { field: 'timestamp', label: 'Time', type: 'datetime' },
                yAxis: { field: 'electrical.activePower', label: 'Power (kW)', type: 'number', aggregationType: 'AVERAGE' },
                series: [
                    { name: 'Active Power', field: 'electrical.activePower', aggregation: 'AVERAGE', color: '#7cb5ec' }
                ],
                timeRange: '24h',
                realTime: { enabled: true, maxDataPoints: 100 }
            },
            efficiencyComparison: {
                name: 'Efficiency Comparison',
                chartType: 'column',
                level: 'PLANT',
                xAxis: { field: 'name', label: 'Plant', type: 'category' },
                yAxis: { field: 'avgEfficiency', label: 'Efficiency (%)', type: 'number', aggregationType: 'AVERAGE' },
                series: [
                    { name: 'Efficiency', field: 'avgEfficiency', aggregation: 'AVERAGE', color: '#90ed7d' }
                ],
                timeRange: '24h'
            },
            powerDistribution: {
                name: 'Power Distribution',
                chartType: 'pie',
                level: 'STATE',
                yAxis: { field: 'totalPower', label: 'Power (MW)', type: 'number', aggregationType: 'SUM' },
                series: [
                    { name: 'Power Distribution', field: 'totalPower', aggregation: 'SUM', color: '#f7a35c' }
                ],
                timeRange: '1h'
            },
            environmentalCorrelation: {
                name: 'Environmental Correlation',
                chartType: 'scatter',
                level: 'EQUIPMENT',
                xAxis: { field: 'environmental.weather.solarIrradiance', label: 'Solar Irradiance (W/m²)', type: 'number' },
                yAxis: { field: 'electrical.activePower', label: 'Power (kW)', type: 'number', aggregationType: 'AVERAGE' },
                series: [
                    { name: 'Power vs Irradiance', field: 'electrical.activePower', aggregation: 'AVERAGE', color: '#f45b5b' }
                ],
                timeRange: '24h'
            }
        };
    }

    /**
     * Get available fields for a specific data level
     */
    async getAvailableFields(level, entityId = null) {
        try {
            const fields = this.fieldMappings[level] || {};
            const result = {
                level,
                entityId,
                categories: {}
            };

            // Add predefined field mappings
            Object.keys(fields).forEach(category => {
                result.categories[category] = Object.keys(fields[category]).map(fieldPath => ({
                    field: fieldPath,
                    ...fields[category][fieldPath]
                }));
            });

            // For equipment level, also discover fields from actual data
            if (level === 'EQUIPMENT') {
                const dynamicFields = await this.discoverEquipmentFields(entityId);
                if (dynamicFields.length > 0) {
                    result.categories.dynamic = dynamicFields;
                }
            }

            return result;

        } catch (error) {
            console.error('Error getting available fields:', error);
            throw error;
        }
    }

    /**
     * Discover fields from actual equipment readings
     */
    async discoverEquipmentFields(equipmentId = null) {
        try {
            const query = equipmentId ? { equipment: equipmentId } : {};
            const sampleReadings = await Reading.find(query)
                .limit(10)
                .lean();

            if (sampleReadings.length === 0) {
                return [];
            }

            const fieldSet = new Set();
            
            sampleReadings.forEach(reading => {
                this.extractFieldPaths(reading, '', fieldSet);
            });

            return Array.from(fieldSet)
                .filter(field => !field.includes('_id') && !field.includes('__v'))
                .map(field => ({
                    field,
                    label: this.generateFieldLabel(field),
                    type: this.inferFieldType(field, sampleReadings),
                    unit: this.inferFieldUnit(field),
                    aggregation: this.inferDefaultAggregation(field)
                }));

        } catch (error) {
            console.error('Error discovering equipment fields:', error);
            return [];
        }
    }

    /**
     * Extract field paths from nested object
     */
    extractFieldPaths(obj, prefix, fieldSet) {
        Object.keys(obj).forEach(key => {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                this.extractFieldPaths(value, fullPath, fieldSet);
            } else if (typeof value === 'number' || typeof value === 'string' || value instanceof Date) {
                fieldSet.add(fullPath);
            }
        });
    }

    /**
     * Generate human-readable label from field path
     */
    generateFieldLabel(fieldPath) {
        return fieldPath
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
            .replace(/([A-Z])/g, ' $1')
            .trim();
    }

    /**
     * Infer field type from sample data
     */
    inferFieldType(fieldPath, sampleData) {
        const values = sampleData.map(item => this.getNestedValue(item, fieldPath)).filter(v => v !== undefined);
        
        if (values.length === 0) return 'string';
        
        const firstValue = values[0];
        
        if (firstValue instanceof Date || fieldPath.includes('timestamp') || fieldPath.includes('time')) {
            return 'datetime';
        }
        
        if (typeof firstValue === 'number') {
            return 'number';
        }
        
        if (typeof firstValue === 'boolean') {
            return 'boolean';
        }
        
        return 'string';
    }

    /**
     * Infer field unit from field path
     */
    inferFieldUnit(fieldPath) {
        const unitMappings = {
            power: 'kW',
            voltage: 'V',
            current: 'A',
            frequency: 'Hz',
            energy: 'kWh',
            efficiency: '%',
            availability: '%',
            temperature: '°C',
            humidity: '%',
            irradiance: 'W/m²',
            speed: 'm/s',
            direction: '°',
            pressure: 'Pa'
        };

        const lowerPath = fieldPath.toLowerCase();
        
        for (const [key, unit] of Object.entries(unitMappings)) {
            if (lowerPath.includes(key)) {
                return unit;
            }
        }
        
        return '';
    }

    /**
     * Infer default aggregation method
     */
    inferDefaultAggregation(fieldPath) {
        const lowerPath = fieldPath.toLowerCase();
        
        if (lowerPath.includes('count') || lowerPath.includes('total')) {
            return 'SUM';
        }
        
        if (lowerPath.includes('max') || lowerPath.includes('peak')) {
            return 'MAX';
        }
        
        if (lowerPath.includes('min') || lowerPath.includes('minimum')) {
            return 'MIN';
        }
        
        if (lowerPath.includes('timestamp') || lowerPath.includes('time') || lowerPath.includes('date')) {
            return 'LATEST';
        }
        
        return 'AVERAGE';
    }

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Create chart configuration from drag-and-drop builder
     */
    async createChartConfiguration(userId, chartData) {
        try {
            const config = new ChartConfiguration({
                name: chartData.name,
                description: chartData.description,
                level: chartData.level,
                chartType: chartData.chartType,
                xAxis: chartData.xAxis,
                yAxis: chartData.yAxis,
                series: chartData.series || [],
                filters: chartData.filters || {},
                timeRange: chartData.timeRange || '1h',
                refreshInterval: chartData.refreshInterval || 30000,
                realTime: chartData.realTime || { enabled: true, maxDataPoints: 100 },
                chartOptions: {
                    colors: chartData.colors || [],
                    showLegend: chartData.showLegend !== false,
                    showDataLabels: chartData.showDataLabels || false,
                    enableAnimation: chartData.enableAnimation !== false,
                    customOptions: chartData.customOptions || {}
                },
                createdBy: userId,
                tags: chartData.tags || [],
                isTemplate: chartData.isTemplate || false,
                templateCategory: chartData.templateCategory
            });

            await config.save();
            return config;

        } catch (error) {
            console.error('Error creating chart configuration:', error);
            throw error;
        }
    }

    /**
     * Get chart data for visualization
     */
    async getChartData(configId, options = {}) {
        try {
            const config = await ChartConfiguration.findById(configId);
            if (!config) {
                throw new Error('Chart configuration not found');
            }

            // Increment usage count
            await config.incrementUsage();

            // Get data based on level
            let data;
            switch (config.level) {
                case 'EQUIPMENT':
                    data = await this.getEquipmentChartData(config, options);
                    break;
                case 'PLANT':
                    data = await this.getPlantChartData(config, options);
                    break;
                case 'STATE':
                    data = await this.getStateChartData(config, options);
                    break;
                case 'SECTOR':
                    data = await this.getSectorChartData(config, options);
                    break;
                default:
                    throw new Error(`Unsupported data level: ${config.level}`);
            }

            // Format data for Highcharts
            const chartConfig = this.formatForHighcharts(config, data);
            
            return {
                config: chartConfig,
                data,
                metadata: {
                    configId,
                    level: config.level,
                    chartType: config.chartType,
                    lastUpdated: new Date(),
                    dataPoints: data.length
                }
            };

        } catch (error) {
            console.error('Error getting chart data:', error);
            throw error;
        }
    }

    /**
     * Get equipment-level chart data
     */
    async getEquipmentChartData(config, options) {
        const timeRange = this.getTimeRange(config.timeRange);
        const query = {
            timestamp: { $gte: timeRange.start, $lte: timeRange.end }
        };

        // Add entity filter if specified
        if (options.entityIds && options.entityIds.length > 0) {
            query.equipment = { $in: options.entityIds };
        }

        // Add custom filters
        if (config.filters && Object.keys(config.filters).length > 0) {
            Object.assign(query, config.filters);
        }

        const readings = await Reading.find(query)
            .sort({ timestamp: 1 })
            .limit(config.realTime?.maxDataPoints || 1000)
            .lean();

        return readings;
    }

    /**
     * Get plant-level chart data
     */
    async getPlantChartData(config, options) {
        const timeWindow = config.timeRange;
        const plantIds = options.entityIds || [];

        if (plantIds.length === 0) {
            // Get all plants
            const plants = await Plant.find({}).lean();
            plantIds.push(...plants.map(p => p._id));
        }

        const aggregations = await Promise.all(
            plantIds.map(plantId => aggregationEngine.aggregateEquipmentToPlant(plantId, timeWindow))
        );

        return aggregations.filter(agg => agg.dataPoints > 0);
    }

    /**
     * Get state-level chart data
     */
    async getStateChartData(config, options) {
        const timeWindow = config.timeRange;
        const stateIds = options.entityIds || [];

        if (stateIds.length === 0) {
            // Get all states
            const states = await State.find({}).lean();
            stateIds.push(...states.map(s => s._id));
        }

        const aggregations = await Promise.all(
            stateIds.map(stateId => aggregationEngine.aggregatePlantsToState(stateId, timeWindow))
        );

        return aggregations.filter(agg => agg.dataPoints > 0);
    }

    /**
     * Get sector-level chart data
     */
    async getSectorChartData(config, options) {
        const timeWindow = config.timeRange;
        const sectorAgg = await aggregationEngine.aggregateStatesToSector(timeWindow);
        
        return [sectorAgg];
    }

    /**
     * Format data for Highcharts
     */
    formatForHighcharts(config, data) {
        const series = config.series.map(seriesConfig => {
            const seriesData = data.map(item => {
                const xValue = this.getNestedValue(item, config.xAxis.field);
                const yValue = this.getNestedValue(item, seriesConfig.field);
                
                if (config.xAxis.type === 'datetime') {
                    return [new Date(xValue).getTime(), yValue];
                }
                
                return [xValue, yValue];
            }).filter(point => point[1] !== undefined && point[1] !== null);

            return {
                name: seriesConfig.name,
                data: seriesData,
                color: seriesConfig.color,
                type: seriesConfig.type || config.chartType,
                yAxis: seriesConfig.yAxis || 0
            };
        });

        return {
            chart: {
                type: config.chartType,
                animation: config.chartOptions.enableAnimation
            },
            title: {
                text: config.name
            },
            subtitle: {
                text: config.description
            },
            xAxis: {
                title: { text: config.xAxis.label },
                type: config.xAxis.type
            },
            yAxis: {
                title: { text: config.yAxis.label }
            },
            legend: {
                enabled: config.chartOptions.showLegend
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: config.chartOptions.showDataLabels
                    }
                }
            },
            colors: config.chartOptions.colors.length > 0 ? config.chartOptions.colors : undefined,
            series
        };
    }

    /**
     * Get time range for data queries
     */
    getTimeRange(timeRange) {
        const end = new Date();
        let start;

        switch (timeRange) {
            case '15m':
                start = new Date(end.getTime() - 15 * 60 * 1000);
                break;
            case '1h':
                start = new Date(end.getTime() - 60 * 60 * 1000);
                break;
            case '4h':
                start = new Date(end.getTime() - 4 * 60 * 60 * 1000);
                break;
            case '24h':
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                start = new Date(end.getTime() - 60 * 60 * 1000);
        }

        return { start, end };
    }

    /**
     * Get chart templates
     */
    getChartTemplates(level = null) {
        if (level) {
            return Object.values(this.chartTemplates).filter(template => template.level === level);
        }
        return Object.values(this.chartTemplates);
    }

    /**
     * Validate chart configuration
     */
    validateChartConfiguration(chartData) {
        const errors = [];

        if (!chartData.name || chartData.name.trim().length === 0) {
            errors.push('Chart name is required');
        }

        if (!this.supportedChartTypes.includes(chartData.chartType)) {
            errors.push(`Unsupported chart type: ${chartData.chartType}`);
        }

        if (!['EQUIPMENT', 'PLANT', 'STATE', 'SECTOR'].includes(chartData.level)) {
            errors.push(`Invalid data level: ${chartData.level}`);
        }

        if (!chartData.xAxis || !chartData.xAxis.field) {
            errors.push('X-axis field is required');
        }

        if (!chartData.yAxis || !chartData.yAxis.field) {
            errors.push('Y-axis field is required');
        }

        if (chartData.chartType === 'pie' && chartData.yAxis.type !== 'number') {
            errors.push('Pie charts require numeric Y-axis values');
        }

        return errors;
    }
}

module.exports = new ChartBuilderService();
