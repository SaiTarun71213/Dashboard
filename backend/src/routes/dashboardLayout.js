const express = require('express');
const dashboardLayoutController = require('../controllers/dashboardLayoutController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');

const router = express.Router();

/**
 * DASHBOARD LAYOUT ROUTES
 * Handles dashboard layout management with drag-and-drop functionality
 * Provides dashboard creation, widget management, and layout operations
 */

/**
 * @route   POST /api/dashboard-layout/dashboards
 * @desc    Create new dashboard
 * @access  Private (Operator and above)
 * @body    Dashboard configuration data
 */
router.post('/dashboards',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'create'),
    auditLog('Create Dashboard', 'Dashboard'),
    dashboardLayoutController.createDashboard
);

/**
 * @route   GET /api/dashboard-layout/dashboards
 * @desc    Get user dashboards
 * @access  Private (Operator and above)
 * @query   level - Filter by data level
 * @query   dashboardType - Filter by dashboard type
 * @query   category - Filter by category
 * @query   search - Search term
 * @query   page - Page number
 * @query   limit - Items per page
 */
router.get('/dashboards',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'read'),
    dashboardLayoutController.getUserDashboards
);

/**
 * @route   GET /api/dashboard-layout/dashboards/:id
 * @desc    Get dashboard with widget data
 * @access  Private (Operator and above)
 * @params  id - Dashboard ID
 * @query   level - Data level override
 * @query   entityId - Entity ID for data filtering
 * @query   timeRange - Time range for data
 */
router.get('/dashboards/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'read'),
    dashboardLayoutController.getDashboard
);

/**
 * @route   PUT /api/dashboard-layout/dashboards/:id
 * @desc    Update dashboard configuration
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 * @body    Updated dashboard data
 */
router.put('/dashboards/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'update'),
    auditLog('Update Dashboard', 'Dashboard'),
    dashboardLayoutController.updateDashboard
);

/**
 * @route   DELETE /api/dashboard-layout/dashboards/:id
 * @desc    Delete dashboard
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 */
router.delete('/dashboards/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'delete'),
    auditLog('Delete Dashboard', 'Dashboard'),
    dashboardLayoutController.deleteDashboard
);

/**
 * @route   POST /api/dashboard-layout/dashboards/:id/widgets
 * @desc    Add widget to dashboard
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 * @body    Widget configuration data
 */
router.post('/dashboards/:id/widgets',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'update'),
    auditLog('Add Widget to Dashboard', 'Dashboard'),
    dashboardLayoutController.addWidget
);

/**
 * @route   PUT /api/dashboard-layout/dashboards/:id/widgets/:widgetId/layout
 * @desc    Update widget layout (drag-and-drop positioning)
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 * @params  widgetId - Widget ID
 * @body    New layout configuration (x, y, width, height)
 */
router.put('/dashboards/:id/widgets/:widgetId/layout',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'update'),
    dashboardLayoutController.updateWidgetLayout
);

/**
 * @route   DELETE /api/dashboard-layout/dashboards/:id/widgets/:widgetId
 * @desc    Remove widget from dashboard
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 * @params  widgetId - Widget ID
 */
router.delete('/dashboards/:id/widgets/:widgetId',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'update'),
    auditLog('Remove Widget from Dashboard', 'Dashboard'),
    dashboardLayoutController.removeWidget
);

/**
 * @route   POST /api/dashboard-layout/dashboards/:id/auto-arrange
 * @desc    Auto-arrange dashboard widgets
 * @access  Private (Dashboard owner or Admin)
 * @params  id - Dashboard ID
 */
router.post('/dashboards/:id/auto-arrange',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'update'),
    auditLog('Auto-arrange Dashboard', 'Dashboard'),
    dashboardLayoutController.autoArrangeDashboard
);

/**
 * @route   GET /api/dashboard-layout/templates
 * @desc    Get dashboard templates
 * @access  Private (Operator and above)
 * @query   level - Filter by data level
 */
router.get('/templates',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'read'),
    dashboardLayoutController.getDashboardTemplates
);

/**
 * @route   GET /api/dashboard-layout/widget-templates
 * @desc    Get widget templates
 * @access  Private (Operator and above)
 * @query   type - Filter by widget type
 */
router.get('/widget-templates',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'read'),
    dashboardLayoutController.getWidgetTemplates
);

/**
 * @route   POST /api/dashboard-layout/dashboards/from-template
 * @desc    Create dashboard from template
 * @access  Private (Operator and above)
 * @body    templateName, customizations
 */
router.post('/dashboards/from-template',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'create'),
    auditLog('Create Dashboard from Template', 'Dashboard'),
    dashboardLayoutController.createFromTemplate
);

/**
 * @route   POST /api/dashboard-layout/dashboards/:id/duplicate
 * @desc    Duplicate dashboard
 * @access  Private (Operator and above)
 * @params  id - Dashboard ID
 * @body    name - Name for duplicated dashboard
 */
router.post('/dashboards/:id/duplicate',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('dashboards', 'create'),
    auditLog('Duplicate Dashboard', 'Dashboard'),
    dashboardLayoutController.duplicateDashboard
);

module.exports = router;
