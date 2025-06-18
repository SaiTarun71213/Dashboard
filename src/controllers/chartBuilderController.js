const chartBuilderService = require('../services/ChartBuilderService');
const ChartConfiguration = require('../models/ChartConfiguration');

/**
 * CHART BUILDER CONTROLLER
 * Handles drag-and-drop chart builder API endpoints
 * Provides field discovery, chart creation, and data visualization
 */

class ChartBuilderController {
    /**
     * Get available fields for chart building
     * GET /api/chart-builder/fields/:level
     */
    async getAvailableFields(req, res) {
        try {
            const { level } = req.params;
            const { entityId } = req.query;

            if (!['EQUIPMENT', 'PLANT', 'STATE', 'SECTOR'].includes(level)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data level. Must be EQUIPMENT, PLANT, STATE, or SECTOR'
                });
            }

            const fields = await chartBuilderService.getAvailableFields(level, entityId);

            res.json({
                success: true,
                data: {
                    fields,
                    metadata: {
                        level,
                        entityId,
                        totalFields: Object.values(fields.categories).reduce((sum, cat) => sum + cat.length, 0),
                        categories: Object.keys(fields.categories)
                    }
                }
            });

        } catch (error) {
            console.error('Get available fields error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving available fields'
            });
        }
    }

    /**
     * Get chart templates
     * GET /api/chart-builder/templates
     */
    async getChartTemplates(req, res) {
        try {
            const { level, category } = req.query;

            // Get predefined templates
            const predefinedTemplates = chartBuilderService.getChartTemplates(level);

            // Get user-created templates
            const userTemplates = await ChartConfiguration.find({
                isTemplate: true,
                ...(level && { level }),
                ...(category && { templateCategory: category })
            })
            .populate('createdBy', 'name email')
            .sort({ usageCount: -1, createdAt: -1 })
            .lean();

            const templates = {
                predefined: predefinedTemplates,
                userCreated: userTemplates,
                total: predefinedTemplates.length + userTemplates.length
            };

            res.json({
                success: true,
                data: {
                    templates,
                    metadata: {
                        level,
                        category,
                        predefinedCount: predefinedTemplates.length,
                        userCreatedCount: userTemplates.length
                    }
                }
            });

        } catch (error) {
            console.error('Get chart templates error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving chart templates'
            });
        }
    }

    /**
     * Create new chart configuration
     * POST /api/chart-builder/charts
     */
    async createChart(req, res) {
        try {
            const userId = req.user.userId;
            const chartData = req.body;

            // Validate chart configuration
            const validationErrors = chartBuilderService.validateChartConfiguration(chartData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Chart configuration validation failed',
                    errors: validationErrors
                });
            }

            // Create chart configuration
            const chartConfig = await chartBuilderService.createChartConfiguration(userId, chartData);

            res.status(201).json({
                success: true,
                message: 'Chart configuration created successfully',
                data: {
                    chart: chartConfig,
                    chartUrl: `/charts/${chartConfig._id}`
                }
            });

        } catch (error) {
            console.error('Create chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating chart configuration'
            });
        }
    }

    /**
     * Update chart configuration
     * PUT /api/chart-builder/charts/:id
     */
    async updateChart(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const updateData = req.body;

            const chartConfig = await ChartConfiguration.findById(id);
            if (!chartConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'Chart configuration not found'
                });
            }

            // Check permissions
            if (chartConfig.createdBy.toString() !== userId && !['Super Admin', 'Admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to update this chart'
                });
            }

            // Validate updated configuration
            const validationErrors = chartBuilderService.validateChartConfiguration(updateData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Chart configuration validation failed',
                    errors: validationErrors
                });
            }

            // Update chart configuration
            Object.assign(chartConfig, updateData);
            await chartConfig.updateVersion();

            res.json({
                success: true,
                message: 'Chart configuration updated successfully',
                data: {
                    chart: chartConfig
                }
            });

        } catch (error) {
            console.error('Update chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating chart configuration'
            });
        }
    }

    /**
     * Get chart data for visualization
     * GET /api/chart-builder/charts/:id/data
     */
    async getChartData(req, res) {
        try {
            const { id } = req.params;
            const options = {
                entityIds: req.query.entityIds ? req.query.entityIds.split(',') : [],
                timeRange: req.query.timeRange,
                filters: req.query.filters ? JSON.parse(req.query.filters) : {}
            };

            const chartData = await chartBuilderService.getChartData(id, options);

            res.json({
                success: true,
                data: chartData
            });

        } catch (error) {
            console.error('Get chart data error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving chart data'
            });
        }
    }

    /**
     * Get user's chart configurations
     * GET /api/chart-builder/charts
     */
    async getUserCharts(req, res) {
        try {
            const userId = req.user.userId;
            const { level, chartType, category, search, page = 1, limit = 20 } = req.query;

            const query = { createdBy: userId };
            
            if (level) query.level = level;
            if (chartType) query.chartType = chartType;
            if (category) query.templateCategory = category;
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const skip = (page - 1) * limit;
            const [charts, total] = await Promise.all([
                ChartConfiguration.find(query)
                    .sort({ lastUsed: -1, updatedAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                ChartConfiguration.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    charts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get user charts error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user charts'
            });
        }
    }

    /**
     * Delete chart configuration
     * DELETE /api/chart-builder/charts/:id
     */
    async deleteChart(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const chartConfig = await ChartConfiguration.findById(id);
            if (!chartConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'Chart configuration not found'
                });
            }

            // Check permissions
            if (chartConfig.createdBy.toString() !== userId && !['Super Admin', 'Admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to delete this chart'
                });
            }

            await ChartConfiguration.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Chart configuration deleted successfully'
            });

        } catch (error) {
            console.error('Delete chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting chart configuration'
            });
        }
    }

    /**
     * Create template from chart configuration
     * POST /api/chart-builder/charts/:id/template
     */
    async createTemplate(req, res) {
        try {
            const { id } = req.params;
            const { templateName, category } = req.body;
            const userId = req.user.userId;

            const chartConfig = await ChartConfiguration.findById(id);
            if (!chartConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'Chart configuration not found'
                });
            }

            // Check permissions
            if (chartConfig.createdBy.toString() !== userId && !['Super Admin', 'Admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to create template from this chart'
                });
            }

            // Create template
            const template = chartConfig.createTemplate(templateName, category);
            template.createdBy = userId;
            await template.save();

            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                data: {
                    template
                }
            });

        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating template'
            });
        }
    }

    /**
     * Duplicate chart configuration
     * POST /api/chart-builder/charts/:id/duplicate
     */
    async duplicateChart(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const userId = req.user.userId;

            const originalChart = await ChartConfiguration.findById(id);
            if (!originalChart) {
                return res.status(404).json({
                    success: false,
                    message: 'Chart configuration not found'
                });
            }

            // Create duplicate
            const duplicateData = originalChart.toObject();
            delete duplicateData._id;
            delete duplicateData.createdAt;
            delete duplicateData.updatedAt;
            
            duplicateData.name = name || `${originalChart.name} (Copy)`;
            duplicateData.createdBy = userId;
            duplicateData.usageCount = 0;
            duplicateData.lastUsed = null;

            const duplicateChart = new ChartConfiguration(duplicateData);
            await duplicateChart.save();

            res.status(201).json({
                success: true,
                message: 'Chart configuration duplicated successfully',
                data: {
                    chart: duplicateChart
                }
            });

        } catch (error) {
            console.error('Duplicate chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error duplicating chart configuration'
            });
        }
    }

    /**
     * Get chart configuration by ID
     * GET /api/chart-builder/charts/:id
     */
    async getChart(req, res) {
        try {
            const { id } = req.params;

            const chartConfig = await ChartConfiguration.findById(id)
                .populate('createdBy', 'name email')
                .lean();

            if (!chartConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'Chart configuration not found'
                });
            }

            res.json({
                success: true,
                data: {
                    chart: chartConfig
                }
            });

        } catch (error) {
            console.error('Get chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving chart configuration'
            });
        }
    }

    /**
     * Validate chart configuration
     * POST /api/chart-builder/validate
     */
    async validateChart(req, res) {
        try {
            const chartData = req.body;

            const validationErrors = chartBuilderService.validateChartConfiguration(chartData);

            res.json({
                success: validationErrors.length === 0,
                data: {
                    valid: validationErrors.length === 0,
                    errors: validationErrors
                }
            });

        } catch (error) {
            console.error('Validate chart error:', error);
            res.status(500).json({
                success: false,
                message: 'Error validating chart configuration'
            });
        }
    }
}

const chartBuilderController = new ChartBuilderController();

module.exports = {
    getAvailableFields: chartBuilderController.getAvailableFields.bind(chartBuilderController),
    getChartTemplates: chartBuilderController.getChartTemplates.bind(chartBuilderController),
    createChart: chartBuilderController.createChart.bind(chartBuilderController),
    updateChart: chartBuilderController.updateChart.bind(chartBuilderController),
    getChartData: chartBuilderController.getChartData.bind(chartBuilderController),
    getUserCharts: chartBuilderController.getUserCharts.bind(chartBuilderController),
    deleteChart: chartBuilderController.deleteChart.bind(chartBuilderController),
    createTemplate: chartBuilderController.createTemplate.bind(chartBuilderController),
    duplicateChart: chartBuilderController.duplicateChart.bind(chartBuilderController),
    getChart: chartBuilderController.getChart.bind(chartBuilderController),
    validateChart: chartBuilderController.validateChart.bind(chartBuilderController)
};
