const aggregationEngine = require('../services/AggregationEngine');

/**
 * AGGREGATION CONTROLLER
 * Handles real-time data aggregation API endpoints
 * Provides hierarchical aggregations: equipment → plant → state → sector
 */

class AggregationController {
    /**
     * Get plant-level aggregation
     * GET /api/aggregation/plant/:plantId
     */
    async getPlantAggregation(req, res) {
        try {
            const { plantId } = req.params;
            const { timeWindow = '1h' } = req.query;

            // Validate time window
            const validTimeWindows = ['15m', '1h', '24h'];
            if (!validTimeWindows.includes(timeWindow)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid time window. Must be one of: ${validTimeWindows.join(', ')}`
                });
            }

            const aggregation = await aggregationEngine.aggregateEquipmentToPlant(plantId, timeWindow);

            res.json({
                success: true,
                data: {
                    aggregation,
                    metadata: {
                        level: 'plant',
                        plantId,
                        timeWindow,
                        generatedAt: new Date(),
                        cached: aggregation.lastUpdated ? 
                            (Date.now() - new Date(aggregation.lastUpdated).getTime()) < 60000 : false
                    }
                }
            });

        } catch (error) {
            console.error('Get plant aggregation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting plant aggregation'
            });
        }
    }

    /**
     * Get state-level aggregation
     * GET /api/aggregation/state/:stateId
     */
    async getStateAggregation(req, res) {
        try {
            const { stateId } = req.params;
            const { timeWindow = '1h' } = req.query;

            const validTimeWindows = ['15m', '1h', '24h'];
            if (!validTimeWindows.includes(timeWindow)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid time window. Must be one of: ${validTimeWindows.join(', ')}`
                });
            }

            const aggregation = await aggregationEngine.aggregatePlantsToState(stateId, timeWindow);

            res.json({
                success: true,
                data: {
                    aggregation,
                    metadata: {
                        level: 'state',
                        stateId,
                        timeWindow,
                        generatedAt: new Date(),
                        cached: aggregation.lastUpdated ? 
                            (Date.now() - new Date(aggregation.lastUpdated).getTime()) < 60000 : false
                    }
                }
            });

        } catch (error) {
            console.error('Get state aggregation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting state aggregation'
            });
        }
    }

    /**
     * Get sector-level aggregation (all states)
     * GET /api/aggregation/sector
     */
    async getSectorAggregation(req, res) {
        try {
            const { timeWindow = '1h' } = req.query;

            const validTimeWindows = ['15m', '1h', '24h'];
            if (!validTimeWindows.includes(timeWindow)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid time window. Must be one of: ${validTimeWindows.join(', ')}`
                });
            }

            const aggregation = await aggregationEngine.aggregateStatesToSector(timeWindow);

            res.json({
                success: true,
                data: {
                    aggregation,
                    metadata: {
                        level: 'sector',
                        timeWindow,
                        generatedAt: new Date(),
                        cached: aggregation.lastUpdated ? 
                            (Date.now() - new Date(aggregation.lastUpdated).getTime()) < 60000 : false
                    }
                }
            });

        } catch (error) {
            console.error('Get sector aggregation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting sector aggregation'
            });
        }
    }

    /**
     * Get multi-level aggregation (plant, state, sector)
     * GET /api/aggregation/hierarchy/:entityType/:entityId
     */
    async getHierarchyAggregation(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const { timeWindow = '1h' } = req.query;

            const validTimeWindows = ['15m', '1h', '24h'];
            if (!validTimeWindows.includes(timeWindow)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid time window. Must be one of: ${validTimeWindows.join(', ')}`
                });
            }

            let aggregations = {};

            switch (entityType.toLowerCase()) {
                case 'plant':
                    aggregations.plant = await aggregationEngine.aggregateEquipmentToPlant(entityId, timeWindow);
                    break;
                    
                case 'state':
                    aggregations.state = await aggregationEngine.aggregatePlantsToState(entityId, timeWindow);
                    aggregations.sector = await aggregationEngine.aggregateStatesToSector(timeWindow);
                    break;
                    
                case 'sector':
                    aggregations.sector = await aggregationEngine.aggregateStatesToSector(timeWindow);
                    break;
                    
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid entity type. Must be: plant, state, or sector'
                    });
            }

            res.json({
                success: true,
                data: {
                    aggregations,
                    metadata: {
                        entityType,
                        entityId,
                        timeWindow,
                        generatedAt: new Date(),
                        levels: Object.keys(aggregations)
                    }
                }
            });

        } catch (error) {
            console.error('Get hierarchy aggregation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting hierarchy aggregation'
            });
        }
    }

    /**
     * Get real-time dashboard summary
     * GET /api/aggregation/dashboard
     */
    async getDashboardSummary(req, res) {
        try {
            const { timeWindow = '1h' } = req.query;

            // Get sector-level aggregation for overview
            const sectorAggregation = await aggregationEngine.aggregateStatesToSector(timeWindow);

            // Calculate summary metrics
            const summary = {
                overview: {
                    totalPower: sectorAggregation.electrical?.activePower || 0,
                    totalEnergy: sectorAggregation.electrical?.totalEnergy || 0,
                    avgEfficiency: sectorAggregation.performance?.avgEfficiency || 0,
                    avgAvailability: sectorAggregation.performance?.avgAvailability || 0
                },
                equipment: {
                    total: sectorAggregation.equipment?.total || 0,
                    operational: sectorAggregation.equipment?.operational || 0,
                    maintenance: sectorAggregation.equipment?.maintenance || 0,
                    fault: sectorAggregation.equipment?.fault || 0,
                    operationalPercentage: sectorAggregation.equipment?.total > 0 ? 
                        Math.round((sectorAggregation.equipment.operational / sectorAggregation.equipment.total) * 100) : 0
                },
                infrastructure: {
                    states: sectorAggregation.states?.total || 0,
                    plants: sectorAggregation.plants?.total || 0,
                    plantsByType: sectorAggregation.plants?.byType || {}
                },
                environmental: {
                    avgTemperature: sectorAggregation.environmental?.avgTemperature || 0,
                    avgHumidity: sectorAggregation.environmental?.avgHumidity || 0,
                    maxSolarIrradiance: sectorAggregation.environmental?.maxSolarIrradiance || 0,
                    maxWindSpeed: sectorAggregation.environmental?.maxWindSpeed || 0
                },
                dataQuality: {
                    dataPoints: sectorAggregation.dataPoints || 0,
                    lastUpdated: sectorAggregation.lastUpdated,
                    timeWindow
                }
            };

            res.json({
                success: true,
                data: {
                    summary,
                    rawAggregation: sectorAggregation,
                    metadata: {
                        level: 'dashboard',
                        timeWindow,
                        generatedAt: new Date()
                    }
                }
            });

        } catch (error) {
            console.error('Get dashboard summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting dashboard summary'
            });
        }
    }

    /**
     * Clear aggregation cache
     * DELETE /api/aggregation/cache/:level/:id?
     */
    async clearCache(req, res) {
        try {
            const { level, id } = req.params;
            const { timeWindow } = req.query;

            await aggregationEngine.clearCache(level, id || 'all', timeWindow);

            res.json({
                success: true,
                message: `Cache cleared for ${level}${id ? `:${id}` : ''} ${timeWindow ? `(${timeWindow})` : '(all time windows)'}`
            });

        } catch (error) {
            console.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                message: 'Error clearing cache'
            });
        }
    }

    /**
     * Get cache statistics
     * GET /api/aggregation/cache/stats
     */
    async getCacheStats(req, res) {
        try {
            const stats = await aggregationEngine.getCacheStats();

            res.json({
                success: true,
                data: {
                    cache: stats,
                    metadata: {
                        generatedAt: new Date()
                    }
                }
            });

        } catch (error) {
            console.error('Get cache stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting cache statistics'
            });
        }
    }
}

const aggregationController = new AggregationController();

module.exports = {
    getPlantAggregation: aggregationController.getPlantAggregation.bind(aggregationController),
    getStateAggregation: aggregationController.getStateAggregation.bind(aggregationController),
    getSectorAggregation: aggregationController.getSectorAggregation.bind(aggregationController),
    getHierarchyAggregation: aggregationController.getHierarchyAggregation.bind(aggregationController),
    getDashboardSummary: aggregationController.getDashboardSummary.bind(aggregationController),
    clearCache: aggregationController.clearCache.bind(aggregationController),
    getCacheStats: aggregationController.getCacheStats.bind(aggregationController)
};
