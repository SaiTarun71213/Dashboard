const dashboardLayoutService = require('../services/DashboardLayoutService');
const Dashboard = require('../models/Dashboard');

/**
 * DASHBOARD LAYOUT CONTROLLER
 * Handles dashboard layout management API endpoints
 * Provides drag-and-drop dashboard creation and widget management
 */

class DashboardLayoutController {
    /**
     * Create new dashboard
     * POST /api/dashboard-layout/dashboards
     */
    async createDashboard(req, res) {
        try {
            const userId = req.user.userId;
            const dashboardData = req.body;

            const dashboard = await dashboardLayoutService.createDashboard(userId, dashboardData);

            res.status(201).json({
                success: true,
                message: 'Dashboard created successfully',
                data: {
                    dashboard,
                    dashboardUrl: `/dashboards/${dashboard._id}`
                }
            });

        } catch (error) {
            console.error('Create dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating dashboard'
            });
        }
    }

    /**
     * Get dashboard with data
     * GET /api/dashboard-layout/dashboards/:id
     */
    async getDashboard(req, res) {
        try {
            const { id } = req.params;
            const options = {
                level: req.query.level,
                entityId: req.query.entityId,
                timeRange: req.query.timeRange || '1h'
            };

            const dashboard = await dashboardLayoutService.getDashboardWithData(id, options);

            // Increment view count
            await Dashboard.findByIdAndUpdate(id, {
                $inc: { 'usageStats.viewCount': 1 },
                'usageStats.lastViewed': new Date()
            });

            res.json({
                success: true,
                data: {
                    dashboard
                }
            });

        } catch (error) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving dashboard'
            });
        }
    }

    /**
     * Update dashboard
     * PUT /api/dashboard-layout/dashboards/:id
     */
    async updateDashboard(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const updateData = req.body;

            const dashboard = await Dashboard.findById(id);
            if (!dashboard) {
                return res.status(404).json({
                    success: false,
                    message: 'Dashboard not found'
                });
            }

            // Check permissions
            if (dashboard.createdBy.toString() !== userId && !['Super Admin', 'Admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to update this dashboard'
                });
            }

            // Update dashboard
            Object.assign(dashboard, updateData);
            await dashboard.save();

            res.json({
                success: true,
                message: 'Dashboard updated successfully',
                data: {
                    dashboard
                }
            });

        } catch (error) {
            console.error('Update dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating dashboard'
            });
        }
    }

    /**
     * Delete dashboard
     * DELETE /api/dashboard-layout/dashboards/:id
     */
    async deleteDashboard(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const dashboard = await Dashboard.findById(id);
            if (!dashboard) {
                return res.status(404).json({
                    success: false,
                    message: 'Dashboard not found'
                });
            }

            // Check permissions
            if (dashboard.createdBy.toString() !== userId && !['Super Admin', 'Admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to delete this dashboard'
                });
            }

            await Dashboard.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Dashboard deleted successfully'
            });

        } catch (error) {
            console.error('Delete dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting dashboard'
            });
        }
    }

    /**
     * Add widget to dashboard
     * POST /api/dashboard-layout/dashboards/:id/widgets
     */
    async addWidget(req, res) {
        try {
            const { id } = req.params;
            const widgetData = req.body;

            const dashboard = await Dashboard.findById(id);
            if (!dashboard) {
                return res.status(404).json({
                    success: false,
                    message: 'Dashboard not found'
                });
            }

            const widget = await dashboardLayoutService.addWidget(dashboard, widgetData);
            await dashboard.save();

            res.status(201).json({
                success: true,
                message: 'Widget added successfully',
                data: {
                    widget
                }
            });

        } catch (error) {
            console.error('Add widget error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error adding widget'
            });
        }
    }

    /**
     * Update widget layout
     * PUT /api/dashboard-layout/dashboards/:id/widgets/:widgetId/layout
     */
    async updateWidgetLayout(req, res) {
        try {
            const { id, widgetId } = req.params;
            const newLayout = req.body;

            const widget = await dashboardLayoutService.updateWidgetLayout(id, widgetId, newLayout);

            res.json({
                success: true,
                message: 'Widget layout updated successfully',
                data: {
                    widget
                }
            });

        } catch (error) {
            console.error('Update widget layout error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error updating widget layout'
            });
        }
    }

    /**
     * Remove widget from dashboard
     * DELETE /api/dashboard-layout/dashboards/:id/widgets/:widgetId
     */
    async removeWidget(req, res) {
        try {
            const { id, widgetId } = req.params;

            const result = await dashboardLayoutService.removeWidget(id, widgetId);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('Remove widget error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error removing widget'
            });
        }
    }

    /**
     * Auto-arrange dashboard widgets
     * POST /api/dashboard-layout/dashboards/:id/auto-arrange
     */
    async autoArrangeDashboard(req, res) {
        try {
            const { id } = req.params;

            const dashboard = await dashboardLayoutService.autoArrangeDashboard(id);

            res.json({
                success: true,
                message: 'Dashboard auto-arranged successfully',
                data: {
                    dashboard
                }
            });

        } catch (error) {
            console.error('Auto-arrange dashboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error auto-arranging dashboard'
            });
        }
    }

    /**
     * Get dashboard templates
     * GET /api/dashboard-layout/templates
     */
    async getDashboardTemplates(req, res) {
        try {
            const { level } = req.query;

            const templates = dashboardLayoutService.getDashboardTemplates(level);

            res.json({
                success: true,
                data: {
                    templates,
                    metadata: {
                        level,
                        count: templates.length
                    }
                }
            });

        } catch (error) {
            console.error('Get dashboard templates error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving dashboard templates'
            });
        }
    }

    /**
     * Get widget templates
     * GET /api/dashboard-layout/widget-templates
     */
    async getWidgetTemplates(req, res) {
        try {
            const { type } = req.query;

            const templates = dashboardLayoutService.getWidgetTemplates(type);

            res.json({
                success: true,
                data: {
                    templates,
                    metadata: {
                        type,
                        count: templates.length
                    }
                }
            });

        } catch (error) {
            console.error('Get widget templates error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving widget templates'
            });
        }
    }

    /**
     * Create dashboard from template
     * POST /api/dashboard-layout/dashboards/from-template
     */
    async createFromTemplate(req, res) {
        try {
            const userId = req.user.userId;
            const { templateName, customizations } = req.body;

            const dashboard = await dashboardLayoutService.createFromTemplate(userId, templateName, customizations);

            res.status(201).json({
                success: true,
                message: 'Dashboard created from template successfully',
                data: {
                    dashboard,
                    dashboardUrl: `/dashboards/${dashboard._id}`
                }
            });

        } catch (error) {
            console.error('Create from template error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating dashboard from template'
            });
        }
    }

    /**
     * Duplicate dashboard
     * POST /api/dashboard-layout/dashboards/:id/duplicate
     */
    async duplicateDashboard(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { name } = req.body;

            const dashboard = await dashboardLayoutService.duplicateDashboard(id, userId, name);

            res.status(201).json({
                success: true,
                message: 'Dashboard duplicated successfully',
                data: {
                    dashboard,
                    dashboardUrl: `/dashboards/${dashboard._id}`
                }
            });

        } catch (error) {
            console.error('Duplicate dashboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error duplicating dashboard'
            });
        }
    }

    /**
     * Get user dashboards
     * GET /api/dashboard-layout/dashboards
     */
    async getUserDashboards(req, res) {
        try {
            const userId = req.user.userId;
            const { level, dashboardType, category, search, page = 1, limit = 20 } = req.query;

            const query = { createdBy: userId };
            
            if (level) query.level = level;
            if (dashboardType) query.dashboardType = dashboardType;
            if (category) query.templateCategory = category;
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const skip = (page - 1) * limit;
            const [dashboards, total] = await Promise.all([
                Dashboard.find(query)
                    .sort({ 'usageStats.lastViewed': -1, updatedAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .populate('createdBy', 'name email')
                    .lean(),
                Dashboard.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    dashboards,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get user dashboards error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user dashboards'
            });
        }
    }
}

const dashboardLayoutController = new DashboardLayoutController();

module.exports = {
    createDashboard: dashboardLayoutController.createDashboard.bind(dashboardLayoutController),
    getDashboard: dashboardLayoutController.getDashboard.bind(dashboardLayoutController),
    updateDashboard: dashboardLayoutController.updateDashboard.bind(dashboardLayoutController),
    deleteDashboard: dashboardLayoutController.deleteDashboard.bind(dashboardLayoutController),
    addWidget: dashboardLayoutController.addWidget.bind(dashboardLayoutController),
    updateWidgetLayout: dashboardLayoutController.updateWidgetLayout.bind(dashboardLayoutController),
    removeWidget: dashboardLayoutController.removeWidget.bind(dashboardLayoutController),
    autoArrangeDashboard: dashboardLayoutController.autoArrangeDashboard.bind(dashboardLayoutController),
    getDashboardTemplates: dashboardLayoutController.getDashboardTemplates.bind(dashboardLayoutController),
    getWidgetTemplates: dashboardLayoutController.getWidgetTemplates.bind(dashboardLayoutController),
    createFromTemplate: dashboardLayoutController.createFromTemplate.bind(dashboardLayoutController),
    duplicateDashboard: dashboardLayoutController.duplicateDashboard.bind(dashboardLayoutController),
    getUserDashboards: dashboardLayoutController.getUserDashboards.bind(dashboardLayoutController)
};
