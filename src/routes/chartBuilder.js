const express = require('express');
const chartBuilderController = require('../controllers/chartBuilderController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');

const router = express.Router();

/**
 * CHART BUILDER ROUTES
 * Handles drag-and-drop chart builder functionality
 * Provides field discovery, chart creation, templates, and data visualization
 */

/**
 * @route   GET /api/chart-builder/fields/:level
 * @desc    Get available fields for chart building at specified data level
 * @access  Private (Operator and above)
 * @params  level - Data level (EQUIPMENT, PLANT, STATE, SECTOR)
 * @query   entityId - Optional specific entity ID for field discovery
 */
router.get('/fields/:level',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.getAvailableFields
);

/**
 * @route   GET /api/chart-builder/templates
 * @desc    Get chart templates for quick chart creation
 * @access  Private (Operator and above)
 * @query   level - Filter by data level
 * @query   category - Filter by template category
 */
router.get('/templates',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.getChartTemplates
);

/**
 * @route   POST /api/chart-builder/charts
 * @desc    Create new chart configuration
 * @access  Private (Operator and above)
 * @body    Chart configuration data
 */
router.post('/charts',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'create'),
    auditLog('Create Chart Configuration', 'Chart'),
    chartBuilderController.createChart
);

/**
 * @route   GET /api/chart-builder/charts
 * @desc    Get user's chart configurations
 * @access  Private (Operator and above)
 * @query   level - Filter by data level
 * @query   chartType - Filter by chart type
 * @query   category - Filter by category
 * @query   search - Search term
 * @query   page - Page number
 * @query   limit - Items per page
 */
router.get('/charts',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.getUserCharts
);

/**
 * @route   GET /api/chart-builder/charts/:id
 * @desc    Get specific chart configuration
 * @access  Private (Operator and above)
 * @params  id - Chart configuration ID
 */
router.get('/charts/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.getChart
);

/**
 * @route   PUT /api/chart-builder/charts/:id
 * @desc    Update chart configuration
 * @access  Private (Chart owner or Admin)
 * @params  id - Chart configuration ID
 * @body    Updated chart configuration data
 */
router.put('/charts/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'update'),
    auditLog('Update Chart Configuration', 'Chart'),
    chartBuilderController.updateChart
);

/**
 * @route   DELETE /api/chart-builder/charts/:id
 * @desc    Delete chart configuration
 * @access  Private (Chart owner or Admin)
 * @params  id - Chart configuration ID
 */
router.delete('/charts/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'delete'),
    auditLog('Delete Chart Configuration', 'Chart'),
    chartBuilderController.deleteChart
);

/**
 * @route   GET /api/chart-builder/charts/:id/data
 * @desc    Get chart data for visualization
 * @access  Private (Operator and above)
 * @params  id - Chart configuration ID
 * @query   entityIds - Comma-separated entity IDs to include
 * @query   timeRange - Override time range
 * @query   filters - Additional filters (JSON string)
 */
router.get('/charts/:id/data',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.getChartData
);

/**
 * @route   POST /api/chart-builder/charts/:id/template
 * @desc    Create template from chart configuration
 * @access  Private (Chart owner or Admin)
 * @params  id - Chart configuration ID
 * @body    templateName, category
 */
router.post('/charts/:id/template',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'create'),
    auditLog('Create Chart Template', 'Chart'),
    chartBuilderController.createTemplate
);

/**
 * @route   POST /api/chart-builder/charts/:id/duplicate
 * @desc    Duplicate chart configuration
 * @access  Private (Operator and above)
 * @params  id - Chart configuration ID
 * @body    name - Name for duplicated chart
 */
router.post('/charts/:id/duplicate',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'create'),
    auditLog('Duplicate Chart Configuration', 'Chart'),
    chartBuilderController.duplicateChart
);

/**
 * @route   POST /api/chart-builder/validate
 * @desc    Validate chart configuration
 * @access  Private (Operator and above)
 * @body    Chart configuration data to validate
 */
router.post('/validate',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('charts', 'read'),
    chartBuilderController.validateChart
);

module.exports = router;
