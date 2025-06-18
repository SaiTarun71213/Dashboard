const { Reading, Equipment, Plant } = require('../models');
const mongoose = require('mongoose');

/**
 * READING CONTROLLER
 * Handles time-series SCADA data operations
 * Optimized for high-frequency data insertion and complex aggregations
 */

class ReadingController {
    /**
     * Get Readings with Time-based Filtering
     * GET /api/readings
     */
    async getReadings(req, res) {
        try {
            const {
                equipment,
                plant,
                startDate,
                endDate,
                page = 1,
                limit = 100,
                sortOrder = 'desc',
                aggregation = 'none', // none, hourly, daily
                includeWeather = false
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (equipment) filter.equipment = equipment;
            if (plant) filter.plant = plant;
            
            // Date range filter
            if (startDate || endDate) {
                filter.timestamp = {};
                if (startDate) filter.timestamp.$gte = new Date(startDate);
                if (endDate) filter.timestamp.$lte = new Date(endDate);
            }

            // Apply user access scope
            if (req.user.role !== 'Super Admin' && req.user.accessScope.plants.length > 0) {
                filter.plant = { $in: req.user.accessScope.plants.map(p => p._id) };
            }

            let result;

            if (aggregation === 'none') {
                // Raw readings with pagination
                const skip = (parseInt(page) - 1) * parseInt(limit);
                const sort = { timestamp: sortOrder === 'desc' ? -1 : 1 };

                const readings = await Reading.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .populate('equipment', 'name type')
                    .populate('plant', 'name type')
                    .select(this.getReadingFields(includeWeather));

                const total = await Reading.countDocuments(filter);

                result = {
                    readings,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total,
                        itemsPerPage: parseInt(limit)
                    }
                };
            } else {
                // Aggregated readings
                result = await this.getAggregatedReadings(filter, aggregation, includeWeather);
            }

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Get readings error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching readings'
            });
        }
    }

    /**
     * Create New Reading (SCADA Data Ingestion)
     * POST /api/readings
     */
    async createReading(req, res) {
        try {
            const readingData = {
                ...req.body,
                timestamp: req.body.timestamp || new Date()
            };

            // Validate equipment exists and user has access
            const equipment = await Equipment.findById(readingData.equipment).populate('plant');
            if (!equipment) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid equipment ID'
                });
            }

            if (!this.hasEquipmentAccess(req.user, equipment.plant._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this equipment'
                });
            }

            // Set plant ID for faster queries
            readingData.plant = equipment.plant._id;

            const reading = new Reading(readingData);
            await reading.save();

            res.status(201).json({
                success: true,
                message: 'Reading created successfully',
                data: { reading }
            });

        } catch (error) {
            console.error('Create reading error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating reading'
            });
        }
    }

    /**
     * Bulk Create Readings (for high-frequency data ingestion)
     * POST /api/readings/bulk
     */
    async createBulkReadings(req, res) {
        try {
            const { readings } = req.body;

            if (!Array.isArray(readings) || readings.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Readings array is required'
                });
            }

            // Validate all equipment IDs and set plant IDs
            const equipmentIds = [...new Set(readings.map(r => r.equipment))];
            const equipmentMap = new Map();

            for (const equipmentId of equipmentIds) {
                const equipment = await Equipment.findById(equipmentId).populate('plant');
                if (!equipment) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid equipment ID: ${equipmentId}`
                    });
                }

                if (!this.hasEquipmentAccess(req.user, equipment.plant._id)) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied to equipment: ${equipmentId}`
                    });
                }

                equipmentMap.set(equipmentId, equipment.plant._id);
            }

            // Prepare readings with plant IDs and timestamps
            const preparedReadings = readings.map(reading => ({
                ...reading,
                plant: equipmentMap.get(reading.equipment),
                timestamp: reading.timestamp || new Date()
            }));

            // Bulk insert for performance
            const insertedReadings = await Reading.insertMany(preparedReadings);

            res.status(201).json({
                success: true,
                message: `${insertedReadings.length} readings created successfully`,
                data: {
                    count: insertedReadings.length,
                    equipmentCount: equipmentIds.length
                }
            });

        } catch (error) {
            console.error('Bulk create readings error:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating bulk readings'
            });
        }
    }

    /**
     * Get Latest Readings for Equipment
     * GET /api/readings/latest
     */
    async getLatestReadings(req, res) {
        try {
            const { equipment, plant, limit = 10 } = req.query;

            const filter = {};
            if (equipment) filter.equipment = equipment;
            if (plant) filter.plant = plant;

            // Apply user access scope
            if (req.user.role !== 'Super Admin' && req.user.accessScope.plants.length > 0) {
                filter.plant = { $in: req.user.accessScope.plants.map(p => p._id) };
            }

            let latestReadings;

            if (equipment) {
                // Latest readings for specific equipment
                latestReadings = await Reading.find(filter)
                    .sort({ timestamp: -1 })
                    .limit(parseInt(limit))
                    .populate('equipment', 'name type')
                    .populate('plant', 'name type');
            } else {
                // Latest reading per equipment
                latestReadings = await Reading.aggregate([
                    { $match: filter },
                    { $sort: { timestamp: -1 } },
                    {
                        $group: {
                            _id: '$equipment',
                            latestReading: { $first: '$$ROOT' }
                        }
                    },
                    { $replaceRoot: { newRoot: '$latestReading' } },
                    { $limit: parseInt(limit) },
                    {
                        $lookup: {
                            from: 'equipment',
                            localField: 'equipment',
                            foreignField: '_id',
                            as: 'equipment',
                            pipeline: [{ $project: { name: 1, type: 1 } }]
                        }
                    },
                    {
                        $lookup: {
                            from: 'plants',
                            localField: 'plant',
                            foreignField: '_id',
                            as: 'plant',
                            pipeline: [{ $project: { name: 1, type: 1 } }]
                        }
                    },
                    { $unwind: '$equipment' },
                    { $unwind: '$plant' }
                ]);
            }

            res.json({
                success: true,
                data: { readings: latestReadings }
            });

        } catch (error) {
            console.error('Get latest readings error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching latest readings'
            });
        }
    }

    /**
     * Get Chart Data for Dashboard
     * GET /api/readings/chart-data
     */
    async getChartData(req, res) {
        try {
            const {
                equipment,
                plant,
                startDate,
                endDate,
                metric = 'activePower', // activePower, efficiency, solarIrradiance, windSpeed
                interval = 'hour' // hour, day, week, month
            } = req.query;

            const filter = {};
            if (equipment) filter.equipment = new mongoose.Types.ObjectId(equipment);
            if (plant) filter.plant = new mongoose.Types.ObjectId(plant);
            
            // Default to last 24 hours if no date range provided
            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date(end.getTime() - 24 * 60 * 60 * 1000);
            
            filter.timestamp = { $gte: start, $lte: end };

            // Apply user access scope
            if (req.user.role !== 'Super Admin' && req.user.accessScope.plants.length > 0) {
                filter.plant = { $in: req.user.accessScope.plants.map(p => new mongoose.Types.ObjectId(p._id)) };
            }

            // Build aggregation pipeline
            const pipeline = [
                { $match: filter },
                {
                    $group: {
                        _id: this.getTimeGrouping(interval),
                        ...this.getMetricAggregation(metric),
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } },
                {
                    $project: {
                        timestamp: '$_id',
                        value: this.getMetricProjection(metric),
                        count: 1,
                        _id: 0
                    }
                }
            ];

            const chartData = await Reading.aggregate(pipeline);

            res.json({
                success: true,
                data: {
                    chartData,
                    metadata: {
                        metric,
                        interval,
                        startDate: start,
                        endDate: end,
                        dataPoints: chartData.length
                    }
                }
            });

        } catch (error) {
            console.error('Get chart data error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching chart data'
            });
        }
    }

    /**
     * Get Aggregated Readings
     */
    async getAggregatedReadings(filter, aggregation, includeWeather) {
        const groupBy = aggregation === 'hourly' ? 
            { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" } } :
            { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };

        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: groupBy,
                    avgActivePower: { $avg: '$electrical.activePower' },
                    maxActivePower: { $max: '$electrical.activePower' },
                    avgEfficiency: { $avg: '$performance.efficiency' },
                    avgAvailability: { $avg: '$performance.availability' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ];

        if (includeWeather) {
            pipeline[1].$group.avgSolarIrradiance = { $avg: '$environmental.weather.solarIrradiance' };
            pipeline[1].$group.avgWindSpeed = { $avg: '$environmental.weather.windSpeed' };
            pipeline[1].$group.avgTemperature = { $avg: '$environmental.weather.temperature.ambient' };
        }

        const aggregatedData = await Reading.aggregate(pipeline);

        return { aggregatedReadings: aggregatedData };
    }

    /**
     * Helper: Get reading fields based on requirements
     */
    getReadingFields(includeWeather) {
        let fields = 'timestamp electrical.activePower electrical.voltage electrical.current performance.efficiency performance.availability';
        
        if (includeWeather) {
            fields += ' environmental.weather.solarIrradiance environmental.weather.windSpeed environmental.weather.temperature';
        }
        
        return fields;
    }

    /**
     * Helper: Get time grouping for aggregation
     */
    getTimeGrouping(interval) {
        switch (interval) {
            case 'hour':
                return { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" } };
            case 'day':
                return { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
            case 'week':
                return { $dateToString: { format: "%Y-W%U", date: "$timestamp" } };
            case 'month':
                return { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
            default:
                return { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" } };
        }
    }

    /**
     * Helper: Get metric aggregation
     */
    getMetricAggregation(metric) {
        switch (metric) {
            case 'activePower':
                return {
                    avg: { $avg: '$electrical.activePower' },
                    max: { $max: '$electrical.activePower' },
                    min: { $min: '$electrical.activePower' }
                };
            case 'efficiency':
                return {
                    avg: { $avg: '$performance.efficiency' },
                    max: { $max: '$performance.efficiency' },
                    min: { $min: '$performance.efficiency' }
                };
            case 'solarIrradiance':
                return {
                    avg: { $avg: '$environmental.weather.solarIrradiance' },
                    max: { $max: '$environmental.weather.solarIrradiance' },
                    min: { $min: '$environmental.weather.solarIrradiance' }
                };
            case 'windSpeed':
                return {
                    avg: { $avg: '$environmental.weather.windSpeed' },
                    max: { $max: '$environmental.weather.windSpeed' },
                    min: { $min: '$environmental.weather.windSpeed' }
                };
            default:
                return { avg: { $avg: '$electrical.activePower' } };
        }
    }

    /**
     * Helper: Get metric projection
     */
    getMetricProjection(metric) {
        return '$avg'; // Default to average value
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

const readingController = new ReadingController();

module.exports = {
    getReadings: readingController.getReadings.bind(readingController),
    createReading: readingController.createReading.bind(readingController),
    createBulkReadings: readingController.createBulkReadings.bind(readingController),
    getLatestReadings: readingController.getLatestReadings.bind(readingController),
    getChartData: readingController.getChartData.bind(readingController)
};
