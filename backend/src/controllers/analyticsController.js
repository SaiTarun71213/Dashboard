const { State, Plant, Equipment, Reading } = require('../models');
const mongoose = require('mongoose');

/**
 * ANALYTICS CONTROLLER
 * Provides comprehensive analytics and dashboard data
 * Handles complex aggregations across the entire energy ecosystem
 */

class AnalyticsController {
    /**
     * Get Dashboard Overview
     * GET /api/analytics/overview
     */
    async getDashboardOverview(req, res) {
        try {
            // Apply user access scope
            const userFilter = this.getUserFilter(req.user);

            // Parallel execution of all analytics
            const [
                stateStats,
                plantStats,
                equipmentStats,
                recentReadings,
                performanceMetrics,
                alertsSummary
            ] = await Promise.all([
                this.getStateStatistics(userFilter),
                this.getPlantStatistics(userFilter),
                this.getEquipmentStatistics(userFilter),
                this.getRecentReadings(userFilter),
                this.getPerformanceMetrics(userFilter),
                this.getAlertsSummary(userFilter)
            ]);

            res.json({
                success: true,
                data: {
                    overview: {
                        states: stateStats,
                        plants: plantStats,
                        equipment: equipmentStats,
                        performance: performanceMetrics,
                        alerts: alertsSummary
                    },
                    recentActivity: recentReadings,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Dashboard overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard overview'
            });
        }
    }

    /**
     * Get Energy Production Trends
     * GET /api/analytics/trends
     */
    async getEnergyTrends(req, res) {
        try {
            const {
                period = '7d', // 1d, 7d, 30d, 1y
                groupBy = 'day', // hour, day, week, month
                metric = 'energy' // energy, power, efficiency
            } = req.query;

            const userFilter = this.getUserFilter(req.user);
            const dateRange = this.getDateRange(period);

            // Build aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        timestamp: { $gte: dateRange.start, $lte: dateRange.end },
                        ...userFilter.readings
                    }
                },
                {
                    $group: {
                        _id: this.getTimeGrouping(groupBy),
                        totalEnergy: { $sum: '$electrical.energy.totalGeneration' },
                        avgPower: { $avg: '$electrical.activePower' },
                        maxPower: { $max: '$electrical.activePower' },
                        avgEfficiency: { $avg: '$performance.efficiency' },
                        dataPoints: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } },
                {
                    $project: {
                        period: '$_id',
                        energy: '$totalEnergy',
                        power: '$avgPower',
                        peakPower: '$maxPower',
                        efficiency: { $round: ['$avgEfficiency', 2] },
                        dataPoints: 1,
                        _id: 0
                    }
                }
            ];

            const trends = await Reading.aggregate(pipeline);

            // Calculate growth rates
            const growthRates = this.calculateGrowthRates(trends, metric);

            res.json({
                success: true,
                data: {
                    trends,
                    growthRates,
                    metadata: {
                        period,
                        groupBy,
                        metric,
                        dateRange,
                        totalDataPoints: trends.length
                    }
                }
            });

        } catch (error) {
            console.error('Energy trends error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching energy trends'
            });
        }
    }

    /**
     * Get Plant Performance Comparison
     * GET /api/analytics/plant-comparison
     */
    async getPlantComparison(req, res) {
        try {
            const { metric = 'efficiency', period = '30d' } = req.query;
            const userFilter = this.getUserFilter(req.user);
            const dateRange = this.getDateRange(period);

            const pipeline = [
                {
                    $match: {
                        timestamp: { $gte: dateRange.start, $lte: dateRange.end },
                        ...userFilter.readings
                    }
                },
                {
                    $lookup: {
                        from: 'plants',
                        localField: 'plant',
                        foreignField: '_id',
                        as: 'plantInfo'
                    }
                },
                { $unwind: '$plantInfo' },
                {
                    $group: {
                        _id: '$plant',
                        plantName: { $first: '$plantInfo.name' },
                        plantType: { $first: '$plantInfo.type' },
                        installedCapacity: { $first: '$plantInfo.technical.capacity.installed' },
                        avgPower: { $avg: '$electrical.activePower' },
                        maxPower: { $max: '$electrical.activePower' },
                        avgEfficiency: { $avg: '$performance.efficiency' },
                        avgAvailability: { $avg: '$performance.availability' },
                        totalEnergy: { $sum: '$electrical.energy.totalGeneration' },
                        dataPoints: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        plantName: 1,
                        plantType: 1,
                        installedCapacity: 1,
                        performance: {
                            avgPower: { $round: ['$avgPower', 2] },
                            maxPower: { $round: ['$maxPower', 2] },
                            efficiency: { $round: ['$avgEfficiency', 2] },
                            availability: { $round: ['$avgAvailability', 2] },
                            capacityFactor: {
                                $round: [
                                    { $multiply: [
                                        { $divide: ['$avgPower', '$installedCapacity'] },
                                        100
                                    ]},
                                    2
                                ]
                            }
                        },
                        totalEnergy: { $round: ['$totalEnergy', 2] },
                        dataPoints: 1
                    }
                },
                { $sort: { [`performance.${metric}`]: -1 } }
            ];

            const comparison = await Reading.aggregate(pipeline);

            // Calculate rankings and benchmarks
            const rankings = this.calculateRankings(comparison, metric);
            const benchmarks = this.calculateBenchmarks(comparison);

            res.json({
                success: true,
                data: {
                    comparison,
                    rankings,
                    benchmarks,
                    metadata: {
                        metric,
                        period,
                        plantsCount: comparison.length
                    }
                }
            });

        } catch (error) {
            console.error('Plant comparison error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching plant comparison'
            });
        }
    }

    /**
     * Get Environmental Impact Report
     * GET /api/analytics/environmental-impact
     */
    async getEnvironmentalImpact(req, res) {
        try {
            const { period = '1y' } = req.query;
            const userFilter = this.getUserFilter(req.user);
            const dateRange = this.getDateRange(period);

            // Get total energy generation
            const energyStats = await Reading.aggregate([
                {
                    $match: {
                        timestamp: { $gte: dateRange.start, $lte: dateRange.end },
                        ...userFilter.readings
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalEnergyGenerated: { $sum: '$electrical.energy.totalGeneration' },
                        avgPower: { $avg: '$electrical.activePower' }
                    }
                }
            ]);

            const totalEnergy = energyStats[0]?.totalEnergyGenerated || 0;

            // Calculate environmental benefits
            const environmentalImpact = {
                energyGenerated: {
                    total: Math.round(totalEnergy),
                    unit: 'kWh'
                },
                carbonFootprint: {
                    co2Avoided: Math.round(totalEnergy * 0.82), // kg CO2 per kWh avoided
                    unit: 'kg CO2'
                },
                equivalents: {
                    treesPlanted: Math.round(totalEnergy * 0.82 / 21.77), // Trees equivalent
                    carsOffRoad: Math.round(totalEnergy * 0.82 / 4600), // Cars off road for a year
                    homesPoweered: Math.round(totalEnergy / 10800) // Average home consumption per year
                },
                waterSaved: {
                    total: Math.round(totalEnergy * 2.3), // Liters saved vs thermal power
                    unit: 'liters'
                },
                coalEquivalent: {
                    total: Math.round(totalEnergy * 0.4), // kg coal equivalent
                    unit: 'kg'
                }
            };

            // Get breakdown by plant type
            const typeBreakdown = await Reading.aggregate([
                {
                    $match: {
                        timestamp: { $gte: dateRange.start, $lte: dateRange.end },
                        ...userFilter.readings
                    }
                },
                {
                    $lookup: {
                        from: 'plants',
                        localField: 'plant',
                        foreignField: '_id',
                        as: 'plantInfo'
                    }
                },
                { $unwind: '$plantInfo' },
                {
                    $group: {
                        _id: '$plantInfo.type',
                        totalEnergy: { $sum: '$electrical.energy.totalGeneration' },
                        avgPower: { $avg: '$electrical.activePower' }
                    }
                },
                {
                    $project: {
                        type: '$_id',
                        energy: { $round: ['$totalEnergy', 2] },
                        power: { $round: ['$avgPower', 2] },
                        co2Avoided: { $round: [{ $multiply: ['$totalEnergy', 0.82] }, 2] },
                        _id: 0
                    }
                }
            ]);

            res.json({
                success: true,
                data: {
                    environmentalImpact,
                    typeBreakdown,
                    metadata: {
                        period,
                        dateRange,
                        calculationDate: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('Environmental impact error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching environmental impact data'
            });
        }
    }

    /**
     * Helper: Get user-specific filters
     */
    getUserFilter(user) {
        if (user.role === 'Super Admin') {
            return { plants: {}, readings: {} };
        }

        const plantIds = user.accessScope.plants.map(p => p._id);
        return {
            plants: { _id: { $in: plantIds } },
            readings: { plant: { $in: plantIds } }
        };
    }

    /**
     * Helper: Get date range based on period
     */
    getDateRange(period) {
        const end = new Date();
        let start;

        switch (period) {
            case '1d':
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return { start, end };
    }

    /**
     * Helper: Get time grouping for aggregation
     */
    getTimeGrouping(groupBy) {
        switch (groupBy) {
            case 'hour':
                return { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" } };
            case 'day':
                return { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
            case 'week':
                return { $dateToString: { format: "%Y-W%U", date: "$timestamp" } };
            case 'month':
                return { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
            default:
                return { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
        }
    }

    /**
     * Helper: Calculate growth rates
     */
    calculateGrowthRates(trends, metric) {
        if (trends.length < 2) return { current: 0, previous: 0, growth: 0 };

        const current = trends[trends.length - 1][metric] || 0;
        const previous = trends[trends.length - 2][metric] || 0;
        const growth = previous !== 0 ? ((current - previous) / previous * 100) : 0;

        return {
            current: Math.round(current * 100) / 100,
            previous: Math.round(previous * 100) / 100,
            growth: Math.round(growth * 100) / 100
        };
    }

    /**
     * Helper: Calculate rankings
     */
    calculateRankings(comparison, metric) {
        return comparison.map((plant, index) => ({
            rank: index + 1,
            plantName: plant.plantName,
            value: plant.performance[metric],
            percentile: Math.round((1 - index / comparison.length) * 100)
        }));
    }

    /**
     * Helper: Calculate benchmarks
     */
    calculateBenchmarks(comparison) {
        const efficiencies = comparison.map(p => p.performance.efficiency).filter(e => e > 0);
        const availabilities = comparison.map(p => p.performance.availability).filter(a => a > 0);

        return {
            efficiency: {
                average: Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length * 100) / 100,
                best: Math.max(...efficiencies),
                worst: Math.min(...efficiencies)
            },
            availability: {
                average: Math.round(availabilities.reduce((a, b) => a + b, 0) / availabilities.length * 100) / 100,
                best: Math.max(...availabilities),
                worst: Math.min(...availabilities)
            }
        };
    }

    // Additional helper methods for overview data
    async getStateStatistics(userFilter) {
        return await State.aggregate([
            { $match: userFilter.plants },
            {
                $group: {
                    _id: null,
                    totalStates: { $sum: 1 },
                    totalCapacity: { $sum: '$energyProfile.totalCapacity' },
                    renewableCapacity: { $sum: '$energyProfile.renewableCapacity' }
                }
            }
        ]);
    }

    async getPlantStatistics(userFilter) {
        return await Plant.aggregate([
            { $match: userFilter.plants },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalCapacity: { $sum: '$technical.capacity.installed' }
                }
            }
        ]);
    }

    async getEquipmentStatistics(userFilter) {
        return await Equipment.aggregate([
            {
                $lookup: {
                    from: 'plants',
                    localField: 'plant',
                    foreignField: '_id',
                    as: 'plantInfo'
                }
            },
            { $unwind: '$plantInfo' },
            { $match: userFilter.plants },
            {
                $group: {
                    _id: '$performance.currentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);
    }

    async getRecentReadings(userFilter) {
        return await Reading.find(userFilter.readings)
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('equipment', 'name type')
            .populate('plant', 'name type');
    }

    async getPerformanceMetrics(userFilter) {
        return await Reading.aggregate([
            { $match: userFilter.readings },
            {
                $group: {
                    _id: null,
                    avgEfficiency: { $avg: '$performance.efficiency' },
                    avgAvailability: { $avg: '$performance.availability' },
                    totalPower: { $sum: '$electrical.activePower' }
                }
            }
        ]);
    }

    async getAlertsSummary(userFilter) {
        return await Equipment.aggregate([
            {
                $lookup: {
                    from: 'plants',
                    localField: 'plant',
                    foreignField: '_id',
                    as: 'plantInfo'
                }
            },
            { $unwind: '$plantInfo' },
            { $match: userFilter.plants },
            {
                $project: {
                    activeFaults: {
                        $size: {
                            $filter: {
                                input: '$faults',
                                cond: { $eq: ['$$this.resolvedAt', null] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAlerts: { $sum: '$activeFaults' }
                }
            }
        ]);
    }
}

const analyticsController = new AnalyticsController();

module.exports = {
    getDashboardOverview: analyticsController.getDashboardOverview.bind(analyticsController),
    getEnergyTrends: analyticsController.getEnergyTrends.bind(analyticsController),
    getPlantComparison: analyticsController.getPlantComparison.bind(analyticsController),
    getEnvironmentalImpact: analyticsController.getEnvironmentalImpact.bind(analyticsController)
};
