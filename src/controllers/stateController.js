const { State, Plant, Equipment } = require('../models');
const mongoose = require('mongoose');

/**
 * STATE CONTROLLER
 * Handles CRUD operations and analytics for Indian states
 * Provides comprehensive state-level energy data management
 */

class StateController {
    /**
     * Get All States with Filtering and Pagination
     * GET /api/states
     */
    async getAllStates(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                climate,
                sortBy = 'name',
                sortOrder = 'asc',
                includeStats = false
            } = req.query;

            // Build filter object
            const filter = {};

            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ];
            }

            if (climate) {
                filter['geography.climate'] = climate;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Base query
            let query = State.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            // Include virtual fields if stats requested
            if (includeStats === 'true') {
                query = query.populate('plantsCount');
            }

            const states = await query;
            const total = await State.countDocuments(filter);

            // Calculate additional statistics if requested
            let statistics = null;
            if (includeStats === 'true') {
                statistics = await this.calculateStateStatistics();
            }

            res.json({
                success: true,
                data: {
                    states,
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
            console.error('Get states error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching states'
            });
        }
    }

    /**
     * Get State by ID with Detailed Information
     * GET /api/states/:id
     */
    async getStateById(req, res) {
        try {
            const { id } = req.params;
            const { includeAnalytics = false } = req.query;

            const state = await State.findById(id).populate('plantsCount');

            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'State not found'
                });
            }

            let analytics = null;
            if (includeAnalytics === 'true') {
                analytics = await this.getStateAnalytics(id);
            }

            res.json({
                success: true,
                data: {
                    state,
                    analytics
                }
            });

        } catch (error) {
            console.error('Get state by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching state'
            });
        }
    }

    /**
     * Create New State
     * POST /api/states
     */
    async createState(req, res) {
        try {
            const stateData = {
                ...req.body,
                createdBy: req.user.userId
            };

            const state = new State(stateData);
            await state.save();

            res.status(201).json({
                success: true,
                message: 'State created successfully',
                data: { state }
            });

        } catch (error) {
            console.error('Create state error:', error);

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'State with this name or code already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating state'
            });
        }
    }

    /**
     * Update State
     * PUT /api/states/:id
     */
    async updateState(req, res) {
        try {
            const { id } = req.params;
            const updateData = {
                ...req.body,
                updatedBy: req.user.userId
            };

            const state = await State.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'State not found'
                });
            }

            res.json({
                success: true,
                message: 'State updated successfully',
                data: { state }
            });

        } catch (error) {
            console.error('Update state error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating state'
            });
        }
    }

    /**
     * Delete State
     * DELETE /api/states/:id
     */
    async deleteState(req, res) {
        try {
            const { id } = req.params;

            // Check if state has associated plants
            const plantsCount = await Plant.countDocuments({ 'location.state': id });

            if (plantsCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete state. It has ${plantsCount} associated plants.`
                });
            }

            const state = await State.findByIdAndDelete(id);

            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'State not found'
                });
            }

            res.json({
                success: true,
                message: 'State deleted successfully'
            });

        } catch (error) {
            console.error('Delete state error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting state'
            });
        }
    }

    /**
     * Get Plants in State
     * GET /api/states/:id/plants
     */
    async getStatePlants(req, res) {
        try {
            const { id } = req.params;
            const {
                page = 1,
                limit = 10,
                type,
                status,
                sortBy = 'name',
                sortOrder = 'asc'
            } = req.query;

            // Build filter
            const filter = { 'location.state': id };
            if (type) filter.type = type;
            if (status) filter.status = status;

            // Build sort
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const plants = await Plant.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('location.state', 'name code')
                .populate('equipmentCount');

            const total = await Plant.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    plants,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get state plants error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching state plants'
            });
        }
    }

    /**
     * Get State Analytics
     * GET /api/states/:id/analytics
     */
    async getStateAnalytics(stateId) {
        try {
            const analytics = await Plant.aggregate([
                { $match: { 'location.state': new mongoose.Types.ObjectId(stateId) } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalCapacity: { $sum: '$technical.capacity.installed' },
                        operationalCapacity: { $sum: '$technical.capacity.operational' },
                        avgCapacity: { $avg: '$technical.capacity.installed' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        plantsByType: {
                            $push: {
                                type: '$_id',
                                count: '$count',
                                totalCapacity: '$totalCapacity',
                                operationalCapacity: '$operationalCapacity',
                                avgCapacity: '$avgCapacity'
                            }
                        },
                        totalPlants: { $sum: '$count' },
                        totalInstalledCapacity: { $sum: '$totalCapacity' },
                        totalOperationalCapacity: { $sum: '$operationalCapacity' }
                    }
                }
            ]);

            return analytics[0] || {
                plantsByType: [],
                totalPlants: 0,
                totalInstalledCapacity: 0,
                totalOperationalCapacity: 0
            };

        } catch (error) {
            console.error('State analytics error:', error);
            return null;
        }
    }

    /**
     * Calculate Overall State Statistics
     */
    async calculateStateStatistics() {
        try {
            const statistics = await State.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStates: { $sum: 1 },
                        totalCapacity: { $sum: '$energyProfile.totalCapacity' },
                        totalRenewableCapacity: { $sum: '$energyProfile.renewableCapacity' },
                        avgRenewablePercentage: { $avg: '$renewablePercentage' },
                        climateDistribution: {
                            $push: '$geography.climate'
                        }
                    }
                },
                {
                    $project: {
                        totalStates: 1,
                        totalCapacity: 1,
                        totalRenewableCapacity: 1,
                        avgRenewablePercentage: { $round: ['$avgRenewablePercentage', 2] },
                        renewablePercentage: {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ['$totalRenewableCapacity', '$totalCapacity'] },
                                        100
                                    ]
                                },
                                2
                            ]
                        }
                    }
                }
            ]);

            return statistics[0] || {};

        } catch (error) {
            console.error('Calculate statistics error:', error);
            return {};
        }
    }

    /**
     * Get State Energy Overview
     * GET /api/states/:id/energy-overview
     */
    async getStateEnergyOverview(req, res) {
        try {
            const { id } = req.params;

            const state = await State.findById(id);
            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'State not found'
                });
            }

            // Get plant-level aggregations
            const plantStats = await Plant.aggregate([
                { $match: { 'location.state': new mongoose.Types.ObjectId(id) } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        installedCapacity: { $sum: '$technical.capacity.installed' },
                        operationalCapacity: { $sum: '$technical.capacity.operational' },
                        avgPerformance: { $avg: '$operational.performance.plantLoadFactor' }
                    }
                }
            ]);

            // Get equipment count
            const equipmentCount = await Equipment.aggregate([
                {
                    $lookup: {
                        from: 'plants',
                        localField: 'plant',
                        foreignField: '_id',
                        as: 'plantInfo'
                    }
                },
                { $unwind: '$plantInfo' },
                { $match: { 'plantInfo.location.state': new mongoose.Types.ObjectId(id) } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        onlineCount: {
                            $sum: { $cond: [{ $eq: ['$performance.currentStatus', 'Online'] }, 1, 0] }
                        }
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    state: {
                        name: state.name,
                        code: state.code,
                        energyProfile: state.energyProfile,
                        renewablePotential: state.renewablePotential
                    },
                    plantStatistics: plantStats,
                    equipmentStatistics: equipmentCount
                }
            });

        } catch (error) {
            console.error('State energy overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching state energy overview'
            });
        }
    }
}

const stateController = new StateController();

module.exports = {
    getAllStates: stateController.getAllStates.bind(stateController),
    getStateById: stateController.getStateById.bind(stateController),
    createState: stateController.createState.bind(stateController),
    updateState: stateController.updateState.bind(stateController),
    deleteState: stateController.deleteState.bind(stateController),
    getStatePlants: stateController.getStatePlants.bind(stateController),
    getStateEnergyOverview: stateController.getStateEnergyOverview.bind(stateController)
};
