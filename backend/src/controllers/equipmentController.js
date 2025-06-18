const { Equipment, Reading, Plant } = require('../models');
const mongoose = require('mongoose');

/**
 * EQUIPMENT CONTROLLER
 * Handles CRUD operations and monitoring for equipment units
 * Supports real-time status monitoring and performance analytics
 */

class EquipmentController {
    /**
     * Get All Equipment with Advanced Filtering
     * GET /api/equipment
     */
    async getAllEquipment(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                search,
                type,
                plant,
                status,
                manufacturer,
                sortBy = 'name',
                sortOrder = 'asc',
                includeStats = false
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { equipmentId: { $regex: search, $options: 'i' } },
                    { 'specifications.serialNumber': { $regex: search, $options: 'i' } }
                ];
            }
            
            if (type) filter.type = type;
            if (plant) filter.plant = plant;
            if (status) filter['performance.currentStatus'] = status;
            if (manufacturer) filter['specifications.manufacturer'] = { $regex: manufacturer, $options: 'i' };

            // Apply user access scope for plants
            if (req.user.role !== 'Super Admin' && req.user.accessScope.plants.length > 0) {
                filter.plant = { $in: req.user.accessScope.plants.map(p => p._id) };
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute query
            const equipment = await Equipment.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('plant', 'name type location.state')
                .select('name equipmentId type performance specifications.manufacturer specifications.model installation.commissioningDate');

            const total = await Equipment.countDocuments(filter);

            // Calculate statistics if requested
            let statistics = null;
            if (includeStats === 'true') {
                statistics = await this.calculateEquipmentStatistics(filter);
            }

            res.json({
                success: true,
                data: {
                    equipment,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: page * limit < total,
                        hasPrevPage: page > 1
                    },
                    statistics
                }
            });

        } catch (error) {
            console.error('Get equipment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching equipment'
            });
        }
    }

    /**
     * Get Equipment by ID with Detailed Information
     * GET /api/equipment/:id
     */
    async getEquipmentById(req, res) {
        try {
            const { id } = req.params;
            const { includeReadings = false, readingsLimit = 100 } = req.query;

            const equipment = await Equipment.findById(id)
                .populate('plant', 'name type location.state location.district');

            if (!equipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipment not found'
                });
            }

            // Check access permissions
            if (!this.hasEquipmentAccess(req.user, equipment.plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this equipment'
                });
            }

            let recentReadings = null;
            if (includeReadings === 'true') {
                recentReadings = await Reading.find({ equipment: id })
                    .sort({ timestamp: -1 })
                    .limit(parseInt(readingsLimit))
                    .select('timestamp electrical.activePower environmental.weather.solarIrradiance environmental.weather.windSpeed performance.efficiency');
            }

            res.json({
                success: true,
                data: {
                    equipment,
                    recentReadings
                }
            });

        } catch (error) {
            console.error('Get equipment by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching equipment'
            });
        }
    }

    /**
     * Create New Equipment
     * POST /api/equipment
     */
    async createEquipment(req, res) {
        try {
            const equipmentData = {
                ...req.body,
                createdBy: req.user.userId
            };

            // Validate plant exists and user has access
            const plant = await Plant.findById(equipmentData.plant);
            if (!plant) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid plant ID'
                });
            }

            if (!this.hasEquipmentAccess(req.user, plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }

            const equipment = new Equipment(equipmentData);
            await equipment.save();

            // Populate the response
            await equipment.populate('plant', 'name type location.state');

            res.status(201).json({
                success: true,
                message: 'Equipment created successfully',
                data: { equipment }
            });

        } catch (error) {
            console.error('Create equipment error:', error);
            
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Equipment with this ID or serial number already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating equipment'
            });
        }
    }

    /**
     * Update Equipment
     * PUT /api/equipment/:id
     */
    async updateEquipment(req, res) {
        try {
            const { id } = req.params;
            
            // Check if equipment exists and user has access
            const existingEquipment = await Equipment.findById(id).populate('plant');
            if (!existingEquipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipment not found'
                });
            }

            if (!this.hasEquipmentAccess(req.user, existingEquipment.plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this equipment'
                });
            }

            const updateData = {
                ...req.body,
                updatedBy: req.user.userId
            };

            const equipment = await Equipment.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('plant', 'name type location.state');

            res.json({
                success: true,
                message: 'Equipment updated successfully',
                data: { equipment }
            });

        } catch (error) {
            console.error('Update equipment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating equipment'
            });
        }
    }

    /**
     * Delete Equipment
     * DELETE /api/equipment/:id
     */
    async deleteEquipment(req, res) {
        try {
            const { id } = req.params;

            // Check if equipment exists and user has access
            const equipment = await Equipment.findById(id).populate('plant');
            if (!equipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipment not found'
                });
            }

            if (!this.hasEquipmentAccess(req.user, equipment.plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this equipment'
                });
            }

            // Check if equipment has associated readings
            const readingsCount = await Reading.countDocuments({ equipment: id });
            
            if (readingsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete equipment. It has ${readingsCount} associated readings. Consider deactivating instead.`
                });
            }

            await Equipment.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Equipment deleted successfully'
            });

        } catch (error) {
            console.error('Delete equipment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting equipment'
            });
        }
    }

    /**
     * Get Equipment Health Status
     * GET /api/equipment/:id/health
     */
    async getEquipmentHealth(req, res) {
        try {
            const { id } = req.params;

            const equipment = await Equipment.findById(id).populate('plant', 'name');
            if (!equipment) {
                return res.status(404).json({
                    success: false,
                    message: 'Equipment not found'
                });
            }

            if (!this.hasEquipmentAccess(req.user, equipment.plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this equipment'
                });
            }

            // Get latest reading for health assessment
            const latestReading = await Reading.findOne({ equipment: id })
                .sort({ timestamp: -1 });

            // Calculate health metrics
            const healthMetrics = {
                overall: 'Good', // Default
                availability: equipment.performance.availability || 0,
                efficiency: equipment.performance.currentEfficiency || 0,
                lastCommunication: latestReading?.timestamp || null,
                communicationStatus: equipment.communication?.communicationStatus || 'Unknown',
                activeAlarms: equipment.faults?.filter(fault => !fault.resolvedAt).length || 0,
                uptime: equipment.uptimePercentage || 0
            };

            // Determine overall health
            if (healthMetrics.availability < 80 || healthMetrics.activeAlarms > 0) {
                healthMetrics.overall = 'Critical';
            } else if (healthMetrics.availability < 90 || healthMetrics.efficiency < 85) {
                healthMetrics.overall = 'Warning';
            }

            res.json({
                success: true,
                data: {
                    equipment: {
                        id: equipment._id,
                        name: equipment.name,
                        type: equipment.type,
                        plant: equipment.plant.name
                    },
                    health: healthMetrics
                }
            });

        } catch (error) {
            console.error('Get equipment health error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching equipment health'
            });
        }
    }

    /**
     * Calculate Equipment Statistics
     */
    async calculateEquipmentStatistics(filter = {}) {
        try {
            const statistics = await Equipment.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        onlineCount: {
                            $sum: { $cond: [{ $eq: ['$performance.currentStatus', 'Online'] }, 1, 0] }
                        },
                        avgAvailability: { $avg: '$performance.availability' },
                        avgEfficiency: { $avg: '$performance.currentEfficiency' },
                        totalPower: { $sum: '$specifications.ratings.power' }
                    }
                },
                {
                    $project: {
                        type: '$_id',
                        count: 1,
                        onlineCount: 1,
                        availability: { $round: ['$avgAvailability', 2] },
                        efficiency: { $round: ['$avgEfficiency', 2] },
                        totalPower: 1,
                        onlinePercentage: {
                            $round: [{ $multiply: [{ $divide: ['$onlineCount', '$count'] }, 100] }, 2]
                        }
                    }
                }
            ]);

            return statistics;

        } catch (error) {
            console.error('Calculate equipment statistics error:', error);
            return [];
        }
    }

    /**
     * Check if user has access to equipment (via plant access)
     */
    hasEquipmentAccess(user, plantId) {
        if (user.role === 'Super Admin') return true;
        
        return user.accessScope.plants.some(
            plant => plant._id.toString() === plantId.toString()
        );
    }
}

const equipmentController = new EquipmentController();

module.exports = {
    getAllEquipment: equipmentController.getAllEquipment.bind(equipmentController),
    getEquipmentById: equipmentController.getEquipmentById.bind(equipmentController),
    createEquipment: equipmentController.createEquipment.bind(equipmentController),
    updateEquipment: equipmentController.updateEquipment.bind(equipmentController),
    deleteEquipment: equipmentController.deleteEquipment.bind(equipmentController),
    getEquipmentHealth: equipmentController.getEquipmentHealth.bind(equipmentController)
};
