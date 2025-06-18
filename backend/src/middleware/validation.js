const { body, param, query, validationResult } = require('express-validator');

/**
 * VALIDATION MIDDLEWARE
 * Input validation rules for all API endpoints
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

/**
 * Authentication Validation Rules
 */
const validateRegister = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('role')
        .optional()
        .isIn(['Super Admin', 'Admin', 'Plant Manager', 'Operator', 'Technician', 'Analyst', 'Viewer'])
        .withMessage('Invalid role specified'),
    
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * State Validation Rules
 */
const validateCreateState = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State name must be between 2 and 100 characters')
        .isIn(['Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh'])
        .withMessage('Invalid state name'),
    
    body('code')
        .trim()
        .isLength({ min: 2, max: 3 })
        .withMessage('State code must be 2-3 characters')
        .isAlpha()
        .withMessage('State code must contain only letters'),
    
    body('geography.coordinates.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    
    body('geography.coordinates.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    
    body('geography.area.total')
        .isFloat({ min: 0 })
        .withMessage('Total area must be a positive number'),
    
    body('geography.climate')
        .isIn(['Tropical', 'Subtropical', 'Arid', 'Semi-Arid', 'Temperate'])
        .withMessage('Invalid climate type'),
    
    handleValidationErrors
];

const validateUpdateState = [
    param('id')
        .isMongoId()
        .withMessage('Invalid state ID'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State name must be between 2 and 100 characters'),
    
    body('geography.coordinates.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    
    body('geography.coordinates.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    
    handleValidationErrors
];

/**
 * Plant Validation Rules
 */
const validateCreatePlant = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Plant name must be between 2 and 200 characters'),
    
    body('type')
        .isIn(['Solar', 'Wind', 'Hydro', 'Hybrid'])
        .withMessage('Invalid plant type'),
    
    body('location.state')
        .isMongoId()
        .withMessage('Invalid state ID'),
    
    body('location.district')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('District name must be between 2 and 100 characters'),
    
    body('location.coordinates.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    
    body('location.coordinates.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    
    body('technical.capacity.installed')
        .isFloat({ min: 0 })
        .withMessage('Installed capacity must be a positive number'),
    
    body('technical.capacity.operational')
        .isFloat({ min: 0 })
        .withMessage('Operational capacity must be a positive number'),
    
    handleValidationErrors
];

/**
 * Equipment Validation Rules
 */
const validateCreateEquipment = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Equipment name must be between 2 and 100 characters'),
    
    body('type')
        .isIn(['Solar Panel', 'Solar Inverter', 'Wind Turbine', 'Hydro Turbine', 'Generator', 'Transformer', 'Switchgear'])
        .withMessage('Invalid equipment type'),
    
    body('plant')
        .isMongoId()
        .withMessage('Invalid plant ID'),
    
    body('specifications.manufacturer')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Manufacturer name must be between 2 and 100 characters'),
    
    body('specifications.model')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Model must be between 2 and 100 characters'),
    
    body('specifications.serialNumber')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Serial number must be between 2 and 100 characters'),
    
    body('specifications.ratings.power')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Power rating must be a positive number'),
    
    handleValidationErrors
];

/**
 * Reading Validation Rules
 */
const validateCreateReading = [
    body('equipment')
        .isMongoId()
        .withMessage('Invalid equipment ID'),
    
    body('plant')
        .isMongoId()
        .withMessage('Invalid plant ID'),
    
    body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Invalid timestamp format'),
    
    body('electrical.activePower')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Active power must be a positive number'),
    
    body('electrical.voltage.l1')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Voltage L1 must be a positive number'),
    
    body('environmental.weather.solarIrradiance')
        .optional()
        .isFloat({ min: 0, max: 2000 })
        .withMessage('Solar irradiance must be between 0 and 2000 W/m²'),
    
    body('environmental.weather.windSpeed')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Wind speed must be between 0 and 100 m/s'),
    
    handleValidationErrors
];

/**
 * Query Parameter Validation
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

const validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format'),
    
    handleValidationErrors
];

const validateMongoId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    
    handleValidationErrors
];

/**
 * File Upload Validation
 */
const validateFileUpload = [
    body('fileType')
        .optional()
        .isIn(['csv', 'xlsx', 'json'])
        .withMessage('Invalid file type. Supported: csv, xlsx, json'),
    
    handleValidationErrors
];

module.exports = {
    // Authentication
    validateRegister,
    validateLogin,
    
    // States
    validateCreateState,
    validateUpdateState,
    
    // Plants
    validateCreatePlant,
    
    // Equipment
    validateCreateEquipment,
    
    // Readings
    validateCreateReading,
    
    // Common
    validatePagination,
    validateDateRange,
    validateMongoId,
    validateFileUpload,
    
    // Utility
    handleValidationErrors
};
