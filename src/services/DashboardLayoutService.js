const Dashboard = require('../models/Dashboard');
const ChartConfiguration = require('../models/ChartConfiguration');
const chartBuilderService = require('./ChartBuilderService');
const aggregationEngine = require('./AggregationEngine');

/**
 * DASHBOARD LAYOUT SERVICE
 * Handles dashboard creation, layout management, and widget operations
 * Provides drag-and-drop functionality and responsive layouts
 */

class DashboardLayoutService {
    constructor() {
        this.defaultGridConfig = {
            columns: 12,
            rowHeight: 60,
            margin: { x: 10, y: 10 },
            breakpoints: {
                lg: 1200,
                md: 996,
                sm: 768,
                xs: 480
            }
        };

        this.widgetTemplates = this.initializeWidgetTemplates();
        this.dashboardTemplates = this.initializeDashboardTemplates();
    }

    /**
     * Initialize widget templates for quick creation
     */
    initializeWidgetTemplates() {
        return {
            powerMetric: {
                type: 'metric',
                title: 'Total Power',
                config: {
                    metric: {
                        field: 'electrical.activePower',
                        label: 'Total Power',
                        unit: 'kW',
                        format: '{value:.1f} kW',
                        aggregation: 'SUM',
                        threshold: {
                            warning: 80,
                            critical: 95
                        }
                    }
                },
                layout: { width: 3, height: 2 }
            },
            efficiencyMetric: {
                type: 'metric',
                title: 'Avg Efficiency',
                config: {
                    metric: {
                        field: 'performance.efficiency',
                        label: 'Efficiency',
                        unit: '%',
                        format: '{value:.1f}%',
                        aggregation: 'AVERAGE',
                        threshold: {
                            warning: 85,
                            critical: 75
                        }
                    }
                },
                layout: { width: 3, height: 2 }
            },
            equipmentTable: {
                type: 'table',
                title: 'Equipment Status',
                config: {
                    table: {
                        columns: [
                            { field: 'name', label: 'Equipment', type: 'string', sortable: true },
                            { field: 'electrical.activePower', label: 'Power (kW)', type: 'number', format: '{value:.1f}' },
                            { field: 'performance.efficiency', label: 'Efficiency (%)', type: 'number', format: '{value:.1f}' },
                            { field: 'performance.currentStatus', label: 'Status', type: 'string' }
                        ],
                        pageSize: 10,
                        sortBy: 'electrical.activePower',
                        sortOrder: 'desc'
                    }
                },
                layout: { width: 6, height: 4 }
            },
            statusText: {
                type: 'text',
                title: 'System Status',
                config: {
                    text: {
                        content: 'All systems operational',
                        format: 'plain',
                        fontSize: '16px',
                        textAlign: 'center',
                        backgroundColor: '#f0f9ff',
                        textColor: '#0369a1'
                    }
                },
                layout: { width: 6, height: 2 }
            }
        };
    }

    /**
     * Initialize dashboard templates
     */
    initializeDashboardTemplates() {
        return {
            overview: {
                name: 'System Overview',
                description: 'High-level system overview with key metrics',
                level: 'SECTOR',
                dashboardType: 'LIVE',
                widgets: [
                    { ...this.widgetTemplates.powerMetric, layout: { x: 0, y: 0, width: 3, height: 2 } },
                    { ...this.widgetTemplates.efficiencyMetric, layout: { x: 3, y: 0, width: 3, height: 2 } },
                    { ...this.widgetTemplates.statusText, layout: { x: 6, y: 0, width: 6, height: 2 } },
                    { ...this.widgetTemplates.equipmentTable, layout: { x: 0, y: 2, width: 12, height: 4 } }
                ]
            },
            plantMonitoring: {
                name: 'Plant Monitoring',
                description: 'Detailed plant performance monitoring',
                level: 'PLANT',
                dashboardType: 'ANALYTICAL',
                widgets: [
                    { ...this.widgetTemplates.powerMetric, layout: { x: 0, y: 0, width: 4, height: 3 } },
                    { ...this.widgetTemplates.efficiencyMetric, layout: { x: 4, y: 0, width: 4, height: 3 } },
                    { ...this.widgetTemplates.equipmentTable, layout: { x: 0, y: 3, width: 8, height: 5 } }
                ]
            }
        };
    }

    /**
     * Create new dashboard
     */
    async createDashboard(userId, dashboardData) {
        try {
            const dashboard = new Dashboard({
                name: dashboardData.name,
                description: dashboardData.description,
                level: dashboardData.level,
                dashboardType: dashboardData.dashboardType || 'ANALYTICAL',
                layout: {
                    ...this.defaultGridConfig,
                    ...dashboardData.layout
                },
                settings: {
                    autoRefresh: dashboardData.autoRefresh !== false,
                    refreshInterval: dashboardData.refreshInterval || 300,
                    theme: dashboardData.theme || 'LIGHT',
                    showGrid: dashboardData.showGrid || false,
                    allowEdit: dashboardData.allowEdit !== false
                },
                createdBy: userId,
                tags: dashboardData.tags || [],
                items: []
            });

            // Add initial widgets if provided
            if (dashboardData.widgets && dashboardData.widgets.length > 0) {
                for (const widgetData of dashboardData.widgets) {
                    await this.addWidget(dashboard, widgetData);
                }
            }

            await dashboard.save();
            return dashboard;

        } catch (error) {
            console.error('Error creating dashboard:', error);
            throw error;
        }
    }

    /**
     * Add widget to dashboard
     */
    async addWidget(dashboard, widgetData) {
        try {
            // Generate unique widget ID
            const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Normalize layout from different possible formats
            const layout = widgetData.layout || widgetData;
            const normalizedLayout = this.normalizeWidgetLayout(layout);

            // Validate layout position
            if (!this.validateWidgetPosition(dashboard, normalizedLayout, null)) {
                throw new Error('Widget position overlaps with existing widget or is out of bounds');
            }

            // Create widget configuration
            const widget = {
                id: widgetId,
                type: widgetData.type,
                title: widgetData.title,
                position: {
                    x: normalizedLayout.x,
                    y: normalizedLayout.y
                },
                size: {
                    width: normalizedLayout.width,
                    height: normalizedLayout.height
                },
                config: widgetData.config || {},
                options: {
                    showTitle: widgetData.showTitle !== false,
                    refreshInterval: widgetData.refreshInterval || 300,
                    autoRefresh: widgetData.autoRefresh !== false,
                    customStyles: widgetData.customStyles || {},
                    resizable: widgetData.resizable !== false,
                    draggable: widgetData.draggable !== false,
                    removable: widgetData.removable !== false,
                    collapsible: widgetData.collapsible || false,
                    collapsed: widgetData.collapsed || false
                }
            };

            // Add chart reference if it's a chart widget
            if (widgetData.type === 'chart' && widgetData.chartId) {
                widget.chartId = widgetData.chartId;
            }

            dashboard.items.push(widget);
            return widget;

        } catch (error) {
            console.error('Error adding widget:', error);
            throw error;
        }
    }

    /**
     * Update widget layout
     */
    async updateWidgetLayout(dashboardId, widgetId, newLayout) {
        try {
            const dashboard = await Dashboard.findById(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const widget = dashboard.items.find(item => item.id === widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }

            // Validate new position
            if (!this.validateWidgetPosition(dashboard, newLayout, widgetId)) {
                throw new Error('New position overlaps with existing widget or is out of bounds');
            }

            // Update widget layout
            widget.position.x = newLayout.x;
            widget.position.y = newLayout.y;
            widget.size.width = newLayout.width;
            widget.size.height = newLayout.height;

            await dashboard.save();
            return widget;

        } catch (error) {
            console.error('Error updating widget layout:', error);
            throw error;
        }
    }

    /**
     * Remove widget from dashboard
     */
    async removeWidget(dashboardId, widgetId) {
        try {
            const dashboard = await Dashboard.findById(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            const widgetIndex = dashboard.items.findIndex(item => item.id === widgetId);
            if (widgetIndex === -1) {
                throw new Error('Widget not found');
            }

            dashboard.items.splice(widgetIndex, 1);
            await dashboard.save();

            return { success: true, message: 'Widget removed successfully' };

        } catch (error) {
            console.error('Error removing widget:', error);
            throw error;
        }
    }

    /**
     * Get dashboard with widget data
     */
    async getDashboardWithData(dashboardId, options = {}) {
        try {
            const dashboard = await Dashboard.findById(dashboardId)
                .populate('createdBy', 'name email')
                .populate('items.chartId', 'name chartType')
                .lean();

            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Get data for each widget
            const widgetsWithData = await Promise.all(
                dashboard.items.map(async (widget) => {
                    let widgetData = null;

                    switch (widget.type) {
                        case 'chart':
                            if (widget.chartId) {
                                widgetData = await chartBuilderService.getChartData(widget.chartId, options);
                            }
                            break;
                        case 'metric':
                            widgetData = await this.getMetricData(widget, options);
                            break;
                        case 'table':
                            widgetData = await this.getTableData(widget, options);
                            break;
                        default:
                            widgetData = { type: widget.type, config: widget.config };
                    }

                    return {
                        ...widget,
                        data: widgetData
                    };
                })
            );

            return {
                ...dashboard,
                items: widgetsWithData
            };

        } catch (error) {
            console.error('Error getting dashboard with data:', error);
            throw error;
        }
    }

    /**
     * Get metric widget data
     */
    async getMetricData(widget, options) {
        try {
            const metricConfig = widget.config.metric;
            if (!metricConfig) {
                return { value: 0, status: 'no-config' };
            }

            // Get aggregated data based on dashboard level
            let aggregation;
            switch (options.level || 'SECTOR') {
                case 'EQUIPMENT':
                    // Get equipment-level data
                    aggregation = await this.getEquipmentMetric(metricConfig, options);
                    break;
                case 'PLANT':
                    aggregation = await aggregationEngine.aggregateEquipmentToPlant(options.entityId, '1h');
                    break;
                case 'STATE':
                    aggregation = await aggregationEngine.aggregatePlantsToState(options.entityId, '1h');
                    break;
                case 'SECTOR':
                default:
                    aggregation = await aggregationEngine.aggregateStatesToSector('1h');
                    break;
            }

            // Extract metric value
            const value = this.extractMetricValue(aggregation, metricConfig.field, metricConfig.aggregation);

            // Determine status based on thresholds
            let status = 'normal';
            if (metricConfig.threshold) {
                if (value >= metricConfig.threshold.critical) {
                    status = 'critical';
                } else if (value >= metricConfig.threshold.warning) {
                    status = 'warning';
                }
            }

            return {
                value,
                status,
                unit: metricConfig.unit,
                format: metricConfig.format,
                label: metricConfig.label,
                lastUpdated: new Date()
            };

        } catch (error) {
            console.error('Error getting metric data:', error);
            return { value: 0, status: 'error', error: error.message };
        }
    }

    /**
     * Get table widget data
     */
    async getTableData(widget, options) {
        try {
            const tableConfig = widget.config.table;
            if (!tableConfig) {
                return { rows: [], columns: [], total: 0 };
            }

            // This would typically fetch data from the database
            // For now, return mock data structure
            return {
                columns: tableConfig.columns,
                rows: [],
                total: 0,
                pageSize: tableConfig.pageSize,
                sortBy: tableConfig.sortBy,
                sortOrder: tableConfig.sortOrder,
                lastUpdated: new Date()
            };

        } catch (error) {
            console.error('Error getting table data:', error);
            return { rows: [], columns: [], total: 0, error: error.message };
        }
    }

    /**
     * Extract metric value from aggregation data
     */
    extractMetricValue(aggregation, fieldPath, aggregationType) {
        const pathParts = fieldPath.split('.');
        let value = aggregation;

        for (const part of pathParts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                return 0;
            }
        }

        return typeof value === 'number' ? value : 0;
    }

    /**
     * Validate widget position
     */
    validateWidgetPosition(dashboard, layout, excludeWidgetId = null) {
        // Normalize layout object to handle both formats
        const normalizedLayout = this.normalizeWidgetLayout(layout);

        // Check bounds
        if (normalizedLayout.x < 0 || normalizedLayout.y < 0 ||
            normalizedLayout.x + normalizedLayout.width > dashboard.layout.columns ||
            normalizedLayout.width <= 0 || normalizedLayout.height <= 0) {
            return false;
        }

        // Check for overlaps with other widgets
        for (const widget of dashboard.items) {
            if (excludeWidgetId && widget.id === excludeWidgetId) {
                continue;
            }

            const widgetLayout = this.normalizeWidgetLayout(widget);
            const overlap = this.checkOverlap(
                { x: widgetLayout.x, y: widgetLayout.y },
                { width: widgetLayout.width, height: widgetLayout.height },
                { x: normalizedLayout.x, y: normalizedLayout.y },
                { width: normalizedLayout.width, height: normalizedLayout.height }
            );

            if (overlap) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalize widget layout to handle different formats
     */
    normalizeWidgetLayout(widget) {
        // Handle frontend format: { x, y, cols, rows }
        if (widget.x !== undefined && widget.cols !== undefined) {
            return {
                x: widget.x,
                y: widget.y,
                width: widget.cols,
                height: widget.rows
            };
        }

        // Handle backend format: { position: { x, y }, size: { width, height } }
        if (widget.position && widget.size) {
            return {
                x: widget.position.x,
                y: widget.position.y,
                width: widget.size.width,
                height: widget.size.height
            };
        }

        // Handle direct layout object: { x, y, width, height }
        if (widget.width !== undefined) {
            return {
                x: widget.x || 0,
                y: widget.y || 0,
                width: widget.width,
                height: widget.height
            };
        }

        // Default fallback
        return {
            x: 0,
            y: 0,
            width: 1,
            height: 1
        };
    }

    /**
     * Check if two rectangles overlap
     */
    checkOverlap(pos1, size1, pos2, size2) {
        // No overlap if one rectangle is to the left, right, above, or below the other
        return !(pos1.x + size1.width <= pos2.x ||
            pos2.x + size2.width <= pos1.x ||
            pos1.y + size1.height <= pos2.y ||
            pos2.y + size2.height <= pos1.y);
    }

    /**
     * Auto-arrange dashboard widgets
     */
    async autoArrangeDashboard(dashboardId) {
        try {
            const dashboard = await Dashboard.findById(dashboardId);
            if (!dashboard) {
                throw new Error('Dashboard not found');
            }

            // Sort widgets by size (larger first)
            const sortedWidgets = [...dashboard.items].sort((a, b) =>
                (b.size.width * b.size.height) - (a.size.width * a.size.height)
            );

            // Reset positions and arrange in grid
            let currentX = 0;
            let currentY = 0;
            let rowHeight = 0;

            for (const widget of sortedWidgets) {
                // Check if widget fits in current row
                if (currentX + widget.size.width > dashboard.layout.columns) {
                    // Move to next row
                    currentX = 0;
                    currentY += rowHeight;
                    rowHeight = 0;
                }

                widget.position.x = currentX;
                widget.position.y = currentY;

                currentX += widget.size.width;
                rowHeight = Math.max(rowHeight, widget.size.height);
            }

            await dashboard.save();
            return dashboard;

        } catch (error) {
            console.error('Error auto-arranging dashboard:', error);
            throw error;
        }
    }

    /**
     * Create dashboard from template
     */
    async createFromTemplate(userId, templateName, customizations = {}) {
        try {
            const template = this.dashboardTemplates[templateName];
            if (!template) {
                throw new Error(`Template '${templateName}' not found`);
            }

            const dashboardData = {
                ...template,
                name: customizations.name || template.name,
                description: customizations.description || template.description,
                level: customizations.level || template.level,
                ...customizations
            };

            return await this.createDashboard(userId, dashboardData);

        } catch (error) {
            console.error('Error creating dashboard from template:', error);
            throw error;
        }
    }

    /**
     * Get dashboard templates
     */
    getDashboardTemplates(level = null) {
        if (level) {
            return Object.values(this.dashboardTemplates).filter(template => template.level === level);
        }
        return Object.values(this.dashboardTemplates);
    }

    /**
     * Get widget templates
     */
    getWidgetTemplates(type = null) {
        if (type) {
            return Object.values(this.widgetTemplates).filter(template => template.type === type);
        }
        return Object.values(this.widgetTemplates);
    }

    /**
     * Duplicate dashboard
     */
    async duplicateDashboard(dashboardId, userId, newName) {
        try {
            const originalDashboard = await Dashboard.findById(dashboardId);
            if (!originalDashboard) {
                throw new Error('Dashboard not found');
            }

            const duplicateData = originalDashboard.toObject();
            delete duplicateData._id;
            delete duplicateData.createdAt;
            delete duplicateData.updatedAt;

            duplicateData.name = newName || `${originalDashboard.name} (Copy)`;
            duplicateData.createdBy = userId;
            duplicateData.usageStats = {
                viewCount: 0,
                avgSessionDuration: 0
            };

            // Generate new widget IDs
            duplicateData.items.forEach(item => {
                item.id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            });

            const duplicateDashboard = new Dashboard(duplicateData);
            await duplicateDashboard.save();

            return duplicateDashboard;

        } catch (error) {
            console.error('Error duplicating dashboard:', error);
            throw error;
        }
    }
}

module.exports = new DashboardLayoutService();
