const { Plant, Equipment, Reading, State } = require('../models');
const mongoose = require('mongoose');

/**
 * PLANT CONTROLLER
 * Handles CRUD operations and analytics for power plants
 * Supports Solar, Wind, Hydro, and Hybrid plants
 */

class PlantController {
    /**
     * Get All Plants with Advanced Filtering
     * GET /api/plants
     */
    async getAllPlants(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                type,
                state,
                status,
                minCapacity,
                maxCapacity,
                sortBy = 'name',
                sortOrder = 'asc',
                includeStats = false
            } = req.query;

            // Build filter object
            const filter = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { plantId: { $regex: search, $options: 'i' } }
                ];
            }

            if (type) filter.type = type;
            if (state) filter['location.state'] = state;
            if (status) filter.status = status;

            if (minCapacity || maxCapacity) {
                filter['technical.capacity.installed'] = {};
                if (minCapacity) filter['technical.capacity.installed'].$gte = parseFloat(minCapacity);
                if (maxCapacity) filter['technical.capacity.installed'].$lte = parseFloat(maxCapacity);
            }

            // Apply user access scope
            if (req.user.role !== 'Super Admin' && req.user.accessScope.plants.length > 0) {
                filter._id = { $in: req.user.accessScope.plants.map(p => p._id) };
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute query
            const plants = await Plant.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('location.state', 'name code')
                .populate('equipmentCount');

            const total = await Plant.countDocuments(filter);

            // Calculate statistics if requested
            let statistics = null;
            if (includeStats === 'true') {
                statistics = await this.calculatePlantStatistics(filter);
            }

            res.json({
                success: true,
                data: {
                    plants,
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
            console.error('Get plants error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching plants'
            });
        }
    }

    /**
     * Get Plant by ID with Detailed Information
     * GET /api/plants/:id
     */
    async getPlantById(req, res) {
        try {
            const { id } = req.params;
            const { includeAnalytics = false, includeEquipment = false } = req.query;

            const plant = await Plant.findById(id)
                .populate('location.state', 'name code geography.coordinates')
                .populate('equipmentCount');

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found'
                });
            }

            // Check access permissions
            if (!this.hasPlantAccess(req.user, plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }

            let analytics = null;
            let equipment = null;

            if (includeAnalytics === 'true') {
                analytics = await this.getPlantAnalytics(id);
            }

            if (includeEquipment === 'true') {
                equipment = await Equipment.find({ plant: id })
                    .select('name type performance.currentStatus specifications.ratings.power')
                    .limit(20); // Limit to prevent large responses
            }

            res.json({
                success: true,
                data: {
                    plant,
                    analytics,
                    equipment
                }
            });

        } catch (error) {
            console.error('Get plant by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching plant'
            });
        }
    }

    /**
     * Create New Plant
     * POST /api/plants
     */
    async createPlant(req, res) {
        try {
            const plantData = {
                ...req.body,
                createdBy: req.user.userId
            };

            // Validate state exists
            const state = await State.findById(plantData.location.state);
            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid state ID'
                });
            }

            const plant = new Plant(plantData);
            await plant.save();

            // Populate the response
            await plant.populate('location.state', 'name code');

            res.status(201).json({
                success: true,
                message: 'Plant created successfully',
                data: { plant }
            });

        } catch (error) {
            console.error('Create plant error:', error);

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Plant with this ID already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating plant'
            });
        }
    }

    /**
     * Update Plant
     * PUT /api/plants/:id
     */
    async updatePlant(req, res) {
        try {
            const { id } = req.params;

            // Check access permissions
            if (!this.hasPlantAccess(req.user, id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }

            const updateData = {
                ...req.body,
                updatedBy: req.user.userId
            };

            const plant = await Plant.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('location.state', 'name code');

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found'
                });
            }

            res.json({
                success: true,
                message: 'Plant updated successfully',
                data: { plant }
            });

        } catch (error) {
            console.error('Update plant error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating plant'
            });
        }
    }

    /**
     * Delete Plant
     * DELETE /api/plants/:id
     */
    async deletePlant(req, res) {
        try {
            const { id } = req.params;

            // Check access permissions
            if (!this.hasPlantAccess(req.user, id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }

            // Check if plant has associated equipment
            const equipmentCount = await Equipment.countDocuments({ plant: id });

            if (equipmentCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete plant. It has ${equipmentCount} associated equipment units.`
                });
            }

            const plant = await Plant.findByIdAndDelete(id);

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found'
                });
            }

            res.json({
                success: true,
                message: 'Plant deleted successfully'
            });

        } catch (error) {
            console.error('Delete plant error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting plant'
            });
        }
    }

    /**
     * Get Plant Equipment
     * GET /api/plants/:id/equipment
     */
    async getPlantEquipment(req, res) {
        try {
            const { id } = req.params;
            const {
                page = 1,
                limit = 20,
                type,
                status,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            // Check access permissions
            if (!this.hasPlantAccess(req.user, id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }

            // Build filter
            const filter = { plant: id };
            if (type) filter.type = type;
            if (status) filter['performance.currentStatus'] = status;

            // Build sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const equipment = await Equipment.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('name type equipmentId performance specifications.manufacturer specifications.model');

            const total = await Equipment.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    equipment,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get plant equipment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching plant equipment'
            });
        }
    }

    /**
     * Get Plant Performance Analytics
     * GET /api/plants/:id/analytics
     */
    async getPlantAnalytics(plantId) {
        try {
            const analytics = await Equipment.aggregate([
                { $match: { plant: new mongoose.Types.ObjectId(plantId) } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        onlineCount: {
                            $sum: { $cond: [{ $eq: ['$performance.currentStatus', 'Online'] }, 1, 0] }
                        },
                        avgAvailability: { $avg: '$performance.availability' },
                        totalPower: { $sum: '$specifications.ratings.power' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        equipmentByType: {
                            $push: {
                                type: '$_id',
                                count: '$count',
                                onlineCount: '$onlineCount',
                                availability: { $round: ['$avgAvailability', 2] },
                                totalPower: '$totalPower'
                            }
                        },
                        totalEquipment: { $sum: '$count' },
                        totalOnline: { $sum: '$onlineCount' },
                        overallAvailability: { $avg: '$avgAvailability' }
                    }
                }
            ]);

            return analytics[0] || {
                equipmentByType: [],
                totalEquipment: 0,
                totalOnline: 0,
                overallAvailability: 0
            };

        } catch (error) {
            console.error('Plant analytics error:', error);
            return null;
        }
    }

    /**
     * Calculate Plant Statistics
     */
    async calculatePlantStatistics(filter = {}) {
        try {
            const statistics = await Plant.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalCapacity: { $sum: '$technical.capacity.installed' },
                        operationalCapacity: { $sum: '$technical.capacity.operational' },
                        avgCapacity: { $avg: '$technical.capacity.installed' }
                    }
                }
            ]);

            return statistics;

        } catch (error) {
            console.error('Calculate plant statistics error:', error);
            return [];
        }
    }

    /**
     * Check if user has access to plant
     */
    hasPlantAccess(user, plantId) {
        if (user.role === 'Super Admin') return true;

        return user.accessScope.plants.some(
            plant => plant._id.toString() === plantId.toString()
        );
    }
}

const plantController = new PlantController();

module.exports = {
    getAllPlants: plantController.getAllPlants.bind(plantController),
    getPlantById: plantController.getPlantById.bind(plantController),
    createPlant: plantController.createPlant.bind(plantController),
    updatePlant: plantController.updatePlant.bind(plantController),
    deletePlant: plantController.deletePlant.bind(plantController),
    getPlantEquipment: plantController.getPlantEquipment.bind(plantController)
};
