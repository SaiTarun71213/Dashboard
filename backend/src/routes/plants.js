const express = require('express');
const plantController = require('../controllers/plantController');
const { 
    authenticate, 
    authorize, 
    checkPermission, 
    checkScope,
    auditLog 
} = require('../middleware/auth');
const { 
    validateCreatePlant, 
    validateMongoId,
    validatePagination 
} = require('../middleware/validation');

const router = express.Router();

/**
 * PLANT ROUTES
 * Handles CRUD operations for power plants
 */

/**
 * @route   GET /api/plants
 * @desc    Get all plants with advanced filtering
 * @access  Private (Viewer and above)
 */
router.get('/',
    authenticate,
    checkPermission('plants', 'read'),
    validatePagination,
    plantController.getAllPlants
);

/**
 * @route   GET /api/plants/:id
 * @desc    Get plant by ID with detailed information
 * @access  Private (Viewer and above)
 */
router.get('/:id',
    authenticate,
    checkPermission('plants', 'read'),
    validateMongoId,
    checkScope('plant'),
    plantController.getPlantById
);

/**
 * @route   POST /api/plants
 * @desc    Create a new plant
 * @access  Private (Plant Manager and above)
 */
router.post('/',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager'),
    checkPermission('plants', 'create'),
    validateCreatePlant,
    auditLog('Create Plant', 'Plant'),
    plantController.createPlant
);

/**
 * @route   PUT /api/plants/:id
 * @desc    Update plant information
 * @access  Private (Plant Manager and above)
 */
router.put('/:id',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager'),
    checkPermission('plants', 'update'),
    validateMongoId,
    checkScope('plant'),
    auditLog('Update Plant', 'Plant'),
    plantController.updatePlant
);

/**
 * @route   DELETE /api/plants/:id
 * @desc    Delete a plant
 * @access  Private (Admin and above)
 */
router.delete('/:id',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('plants', 'delete'),
    validateMongoId,
    checkScope('plant'),
    auditLog('Delete Plant', 'Plant'),
    plantController.deletePlant
);

/**
 * @route   GET /api/plants/:id/equipment
 * @desc    Get all equipment in a plant
 * @access  Private (Viewer and above)
 */
router.get('/:id/equipment',
    authenticate,
    checkPermission('equipment', 'read'),
    validateMongoId,
    validatePagination,
    checkScope('plant'),
    plantController.getPlantEquipment
);

module.exports = router;
