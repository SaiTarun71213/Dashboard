const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const stateRoutes = require('./states');
const plantRoutes = require('./plants');
const equipmentRoutes = require('./equipment');
const readingRoutes = require('./readings');
const analyticsRoutes = require('./analytics');
const simulationRoutes = require('./simulation');
const aggregationRoutes = require('./aggregation');
const webSocketRoutes = require('./websocket');
const chartBuilderRoutes = require('./chartBuilder');
const dashboardLayoutRoutes = require('./dashboardLayout');

const router = express.Router();

/**
 * MAIN ROUTES INDEX
 * Central routing configuration for the Energy Dashboard API
 */

// API Information endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Energy Dashboard API v1.0.0',
        description: 'Comprehensive energy monitoring system for Solar, Wind, and Hydro power plants across Indian states',
        version: '1.0.0',
        endpoints: {
            authentication: {
                base: '/api/auth',
                endpoints: [
                    'POST /api/auth/register - Register new user',
                    'POST /api/auth/login - User login',
                    'POST /api/auth/refresh - Refresh access token',
                    'GET /api/auth/profile - Get user profile',
                    'POST /api/auth/logout - User logout'
                ]
            },
            states: {
                base: '/api/states',
                endpoints: [
                    'GET /api/states - Get all states',
                    'GET /api/states/:id - Get state by ID',
                    'POST /api/states - Create new state',
                    'PUT /api/states/:id - Update state',
                    'DELETE /api/states/:id - Delete state',
                    'GET /api/states/:id/plants - Get state plants',
                    'GET /api/states/:id/energy-overview - Get energy overview'
                ]
            },
            plants: {
                base: '/api/plants',
                endpoints: [
                    'GET /api/plants - Get all plants',
                    'GET /api/plants/:id - Get plant by ID',
                    'POST /api/plants - Create new plant',
                    'PUT /api/plants/:id - Update plant',
                    'DELETE /api/plants/:id - Delete plant',
                    'GET /api/plants/:id/equipment - Get plant equipment'
                ]
            },
            equipment: {
                base: '/api/equipment',
                endpoints: [
                    'GET /api/equipment - Get all equipment',
                    'GET /api/equipment/:id - Get equipment by ID',
                    'POST /api/equipment - Create new equipment',
                    'PUT /api/equipment/:id - Update equipment',
                    'DELETE /api/equipment/:id - Delete equipment',
                    'GET /api/equipment/:id/health - Get equipment health'
                ]
            },
            readings: {
                base: '/api/readings',
                endpoints: [
                    'GET /api/readings - Get readings with filtering',
                    'POST /api/readings - Create new reading',
                    'POST /api/readings/bulk - Bulk create readings',
                    'GET /api/readings/latest - Get latest readings',
                    'GET /api/readings/chart-data - Get chart data'
                ]
            },
            analytics: {
                base: '/api/analytics',
                endpoints: [
                    'GET /api/analytics/overview - Dashboard overview',
                    'GET /api/analytics/trends - Energy trends',
                    'GET /api/analytics/plant-comparison - Plant comparison',
                    'GET /api/analytics/environmental-impact - Environmental impact'
                ]
            },
            simulation: {
                base: '/api/simulation',
                endpoints: [
                    'GET /api/simulation/status - Get simulation status',
                    'POST /api/simulation/start - Start live data simulation',
                    'POST /api/simulation/stop - Stop live data simulation',
                    'POST /api/simulation/restart - Restart simulation',
                    'GET /api/simulation/config - Get simulation configuration',
                    'GET /api/simulation/stats - Get simulation statistics'
                ]
            },
            aggregation: {
                base: '/api/aggregation',
                endpoints: [
                    'GET /api/aggregation/plant/:plantId - Plant-level aggregation',
                    'GET /api/aggregation/state/:stateId - State-level aggregation',
                    'GET /api/aggregation/sector - Sector-level aggregation',
                    'GET /api/aggregation/hierarchy/:type/:id - Multi-level hierarchy',
                    'GET /api/aggregation/dashboard - Real-time dashboard summary',
                    'GET /api/aggregation/cache/stats - Cache statistics',
                    'DELETE /api/aggregation/cache/:level/:id - Clear cache'
                ]
            },
            websocket: {
                base: '/api/websocket',
                endpoints: [
                    'GET /api/websocket/stats - WebSocket service statistics',
                    'GET /api/websocket/clients - Connected clients information',
                    'POST /api/websocket/broadcast - Trigger manual broadcast',
                    'GET /api/websocket/health - Service health status',
                    'GET /api/websocket/config - Service configuration',
                    'POST /api/websocket/test - Send test message'
                ]
            },
            chartBuilder: {
                base: '/api/chart-builder',
                endpoints: [
                    'GET /api/chart-builder/fields/:level - Get available fields for chart building',
                    'GET /api/chart-builder/templates - Get chart templates',
                    'POST /api/chart-builder/charts - Create new chart configuration',
                    'GET /api/chart-builder/charts - Get user chart configurations',
                    'GET /api/chart-builder/charts/:id - Get specific chart configuration',
                    'PUT /api/chart-builder/charts/:id - Update chart configuration',
                    'DELETE /api/chart-builder/charts/:id - Delete chart configuration',
                    'GET /api/chart-builder/charts/:id/data - Get chart data for visualization',
                    'POST /api/chart-builder/charts/:id/template - Create template from chart',
                    'POST /api/chart-builder/charts/:id/duplicate - Duplicate chart configuration',
                    'POST /api/chart-builder/validate - Validate chart configuration'
                ]
            },
            dashboardLayout: {
                base: '/api/dashboard-layout',
                endpoints: [
                    'POST /api/dashboard-layout/dashboards - Create new dashboard',
                    'GET /api/dashboard-layout/dashboards - Get user dashboards',
                    'GET /api/dashboard-layout/dashboards/:id - Get dashboard with data',
                    'PUT /api/dashboard-layout/dashboards/:id - Update dashboard',
                    'DELETE /api/dashboard-layout/dashboards/:id - Delete dashboard',
                    'POST /api/dashboard-layout/dashboards/:id/widgets - Add widget to dashboard',
                    'PUT /api/dashboard-layout/dashboards/:id/widgets/:widgetId/layout - Update widget layout',
                    'DELETE /api/dashboard-layout/dashboards/:id/widgets/:widgetId - Remove widget',
                    'POST /api/dashboard-layout/dashboards/:id/auto-arrange - Auto-arrange widgets',
                    'GET /api/dashboard-layout/templates - Get dashboard templates',
                    'GET /api/dashboard-layout/widget-templates - Get widget templates',
                    'POST /api/dashboard-layout/dashboards/from-template - Create from template',
                    'POST /api/dashboard-layout/dashboards/:id/duplicate - Duplicate dashboard'
                ]
            }
        },
        features: [
            'JWT Authentication with refresh tokens',
            'Role-based access control (RBAC)',
            'Comprehensive input validation',
            'Real-time SCADA data monitoring',
            'Advanced filtering and pagination',
            'Audit logging and activity tracking',
            'Rate limiting and security middleware',
            'Time-series data optimization'
        ],
        supportedPlantTypes: ['Solar', 'Wind', 'Hydro', 'Hybrid'],
        supportedStates: [
            'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu',
            'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh'
        ],
        documentation: {
            swagger: '/api/docs',
            postman: '/api/postman-collection'
        },
        contact: {
            developer: 'Energy Dashboard Team',
            email: 'support@energydashboard.com',
            version: process.env.npm_package_version || '1.0.0'
        }
    });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/states', stateRoutes);
router.use('/plants', plantRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/readings', readingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/simulation', simulationRoutes);
router.use('/aggregation', aggregationRoutes);
router.use('/websocket', webSocketRoutes);
router.use('/chart-builder', chartBuilderRoutes);
router.use('/dashboard-layout', dashboardLayoutRoutes);

// Health check for API routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API routes are healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        routes: {
            auth: 'Active',
            states: 'Active',
            plants: 'Active'
        }
    });
});

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API route ${req.originalUrl} not found`,
        availableRoutes: [
            '/api/auth/*',
            '/api/states/*',
            '/api/plants/*'
        ],
        documentation: '/api'
    });
});

module.exports = router;
