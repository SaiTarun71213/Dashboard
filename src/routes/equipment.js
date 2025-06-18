const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');
const { 
    validateCreateEquipment, 
    validateMongoId,
    validatePagination 
} = require('../middleware/validation');

const router = express.Router();

/**
 * EQUIPMENT ROUTES
 * Handles CRUD operations for equipment units
 */

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment with advanced filtering
 * @access  Private (Viewer and above)
 */
router.get('/',
    authenticate,
    checkPermission('equipment', 'read'),
    validatePagination,
    equipmentController.getAllEquipment
);

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment by ID with detailed information
 * @access  Private (Viewer and above)
 */
router.get('/:id',
    authenticate,
    checkPermission('equipment', 'read'),
    validateMongoId,
    equipmentController.getEquipmentById
);

/**
 * @route   POST /api/equipment
 * @desc    Create new equipment
 * @access  Private (Technician and above)
 */
router.post('/',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Technician'),
    checkPermission('equipment', 'create'),
    validateCreateEquipment,
    auditLog('Create Equipment', 'Equipment'),
    equipmentController.createEquipment
);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update equipment information
 * @access  Private (Technician and above)
 */
router.put('/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Technician'),
    checkPermission('equipment', 'update'),
    validateMongoId,
    auditLog('Update Equipment', 'Equipment'),
    equipmentController.updateEquipment
);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete equipment
 * @access  Private (Admin and above)
 */
router.delete('/:id',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('equipment', 'delete'),
    validateMongoId,
    auditLog('Delete Equipment', 'Equipment'),
    equipmentController.deleteEquipment
);

/**
 * @route   GET /api/equipment/:id/health
 * @desc    Get equipment health status
 * @access  Private (Viewer and above)
 */
router.get('/:id/health',
    authenticate,
    checkPermission('equipment', 'read'),
    validateMongoId,
    equipmentController.getEquipmentHealth
);

module.exports = router;
