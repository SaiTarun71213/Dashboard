const { Reading, Equipment, Plant, State } = require('../models');
const redisConfig = require('../config/redis');

/**
 * REAL-TIME AGGREGATION ENGINE
 * Handles hierarchical data aggregation from equipment → plant → state
 * Uses Redis for high-performance caching and real-time calculations
 */

class AggregationEngine {
    constructor() {
        this.redis = null;
        this.cachePrefix = 'energy_agg';
        this.cacheTTL = 300; // 5 minutes default TTL
        this.aggregationRules = this.defineAggregationRules();
    }

    /**
     * Initialize the aggregation engine
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Aggregation Engine...');

            // Get Redis client
            this.redis = redisConfig.getClient();

            if (this.redis) {
                console.log('✅ Aggregation Engine connected to Redis');
            } else {
                console.log('⚠️ Aggregation Engine running without Redis cache');
            }

            console.log('✅ Aggregation Engine initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Aggregation Engine:', error);
            throw error;
        }
    }

    /**
     * Define aggregation rules for different metrics
     */
    defineAggregationRules() {
        return {
            // Additive metrics (sum across equipment/plants)
            additive: [
                'electrical.activePower',
                'electrical.reactivePower',
                'electrical.energy.totalGeneration',
                'technical.capacity.installed',
                'technical.capacity.operational'
            ],

            // Average metrics (average across equipment/plants)
            average: [
                'performance.efficiency',
                'performance.availability',
                'performance.capacityFactor',
                'environmental.weather.temperature.ambient',
                'environmental.weather.humidity',
                'electrical.voltage.l1',
                'electrical.voltage.l2',
                'electrical.voltage.l3',
                'electrical.frequency'
            ],

            // Maximum metrics (take maximum value)
            maximum: [
                'environmental.weather.solarIrradiance',
                'environmental.weather.windSpeed',
                'electrical.voltage.max',
                'performance.peakPower'
            ],

            // Count metrics (count of items)
            count: [
                'equipmentCount',
                'plantCount',
                'operationalCount',
                'maintenanceCount',
                'faultCount'
            ]
        };
    }

    /**
     * Aggregate equipment data to plant level
     */
    async aggregateEquipmentToPlant(plantId, timeWindow = '1h') {
        try {
            const cacheKey = `${this.cachePrefix}:plant:${plantId}:${timeWindow}`;

            // Try to get from cache first
            if (this.redis) {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }

            // Get time range for aggregation
            const timeRange = this.getTimeRange(timeWindow);

            // Get all equipment for this plant
            const equipment = await Equipment.find({ plant: plantId }).lean();
            const equipmentIds = equipment.map(eq => eq._id);

            if (equipmentIds.length === 0) {
                return this.getEmptyAggregation('plant', plantId);
            }

            // Get recent readings for all equipment in this plant
            const readings = await Reading.find({
                equipment: { $in: equipmentIds },
                timestamp: { $gte: timeRange.start, $lte: timeRange.end }
            }).lean();

            // Perform aggregation
            const aggregation = this.performAggregation(readings, equipment, 'plant');
            aggregation.plantId = plantId;
            aggregation.equipmentCount = equipment.length;
            aggregation.timeWindow = timeWindow;
            aggregation.lastUpdated = new Date();

            // Cache the result
            if (this.redis) {
                await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(aggregation));
            }

            return aggregation;

        } catch (error) {
            console.error('❌ Error aggregating equipment to plant:', error);
            return this.getEmptyAggregation('plant', plantId);
        }
    }

    /**
     * Aggregate plant data to state level
     */
    async aggregatePlantsToState(stateId, timeWindow = '1h') {
        try {
            const cacheKey = `${this.cachePrefix}:state:${stateId}:${timeWindow}`;

            // Try to get from cache first
            if (this.redis) {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }

            // Get all plants in this state
            const plants = await Plant.find({ 'location.state': stateId }).lean();
            const plantIds = plants.map(plant => plant._id);

            if (plantIds.length === 0) {
                return this.getEmptyAggregation('state', stateId);
            }

            // Get aggregated data for each plant
            const plantAggregations = await Promise.all(
                plantIds.map(plantId => this.aggregateEquipmentToPlant(plantId, timeWindow))
            );

            // Aggregate plant data to state level
            const stateAggregation = this.aggregatePlantData(plantAggregations, plants);
            stateAggregation.stateId = stateId;
            stateAggregation.plantCount = plants.length;
            stateAggregation.timeWindow = timeWindow;
            stateAggregation.lastUpdated = new Date();

            // Cache the result
            if (this.redis) {
                await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(stateAggregation));
            }

            return stateAggregation;

        } catch (error) {
            console.error('❌ Error aggregating plants to state:', error);
            return this.getEmptyAggregation('state', stateId);
        }
    }

    /**
     * Get sector-level aggregation (all states)
     */
    async aggregateStatesToSector(timeWindow = '1h') {
        try {
            const cacheKey = `${this.cachePrefix}:sector:all:${timeWindow}`;

            // Try to get from cache first
            if (this.redis) {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }

            // Get all states
            const states = await State.find({}).lean();
            const stateIds = states.map(state => state._id);

            if (stateIds.length === 0) {
                return this.getEmptyAggregation('sector', 'all');
            }

            // Get aggregated data for each state
            const stateAggregations = await Promise.all(
                stateIds.map(stateId => this.aggregatePlantsToState(stateId, timeWindow))
            );

            // Aggregate state data to sector level
            const sectorAggregation = this.aggregateStateData(stateAggregations, states);
            sectorAggregation.sectorId = 'all';
            sectorAggregation.stateCount = states.length;
            sectorAggregation.timeWindow = timeWindow;
            sectorAggregation.lastUpdated = new Date();

            // Cache the result
            if (this.redis) {
                await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(sectorAggregation));
            }

            return sectorAggregation;

        } catch (error) {
            console.error('❌ Error aggregating states to sector:', error);
            return this.getEmptyAggregation('sector', 'all');
        }
    }

    /**
     * Perform aggregation on readings data
     */
    performAggregation(readings, equipment, level) {
        const aggregation = {
            level,
            dataPoints: readings.length,
            electrical: {
                activePower: 0,
                reactivePower: 0,
                totalEnergy: 0,
                avgVoltage: 0,
                avgFrequency: 0
            },
            performance: {
                avgEfficiency: 0,
                avgAvailability: 0,
                avgCapacityFactor: 0
            },
            environmental: {
                avgTemperature: 0,
                avgHumidity: 0,
                maxSolarIrradiance: 0,
                maxWindSpeed: 0
            },
            equipment: {
                total: equipment.length,
                operational: 0,
                maintenance: 0,
                fault: 0
            }
        };

        if (readings.length === 0) {
            return aggregation;
        }

        // Aggregate electrical data
        const electricalData = readings.map(r => r.electrical).filter(e => e);
        if (electricalData.length > 0) {
            aggregation.electrical.activePower = this.sumValues(electricalData, 'activePower');
            aggregation.electrical.reactivePower = this.sumValues(electricalData, 'reactivePower');
            aggregation.electrical.totalEnergy = this.sumValues(electricalData, 'energy.totalGeneration');
            aggregation.electrical.avgVoltage = this.averageValues(electricalData, 'voltage.l1');
            aggregation.electrical.avgFrequency = this.averageValues(electricalData, 'frequency');
        }

        // Aggregate performance data
        const performanceData = readings.map(r => r.performance).filter(p => p);
        if (performanceData.length > 0) {
            aggregation.performance.avgEfficiency = this.averageValues(performanceData, 'efficiency');
            aggregation.performance.avgAvailability = this.averageValues(performanceData, 'availability');
            aggregation.performance.avgCapacityFactor = this.averageValues(performanceData, 'capacityFactor');
        }

        // Aggregate environmental data
        const environmentalData = readings.map(r => r.environmental?.weather).filter(w => w);
        if (environmentalData.length > 0) {
            aggregation.environmental.avgTemperature = this.averageValues(environmentalData, 'temperature.ambient');
            aggregation.environmental.avgHumidity = this.averageValues(environmentalData, 'humidity');
            aggregation.environmental.maxSolarIrradiance = this.maxValue(environmentalData, 'solarIrradiance');
            aggregation.environmental.maxWindSpeed = this.maxValue(environmentalData, 'windSpeed');
        }

        // Count equipment by status
        equipment.forEach(eq => {
            const status = eq.performance?.currentStatus || 'Unknown';
            switch (status.toLowerCase()) {
                case 'operational':
                    aggregation.equipment.operational++;
                    break;
                case 'maintenance':
                    aggregation.equipment.maintenance++;
                    break;
                case 'fault':
                case 'error':
                    aggregation.equipment.fault++;
                    break;
            }
        });

        return aggregation;
    }

    /**
     * Aggregate plant-level data
     */
    aggregatePlantData(plantAggregations, plants) {
        const validAggregations = plantAggregations.filter(agg => agg.dataPoints > 0);

        if (validAggregations.length === 0) {
            return this.getEmptyAggregation('state');
        }

        return {
            level: 'state',
            dataPoints: validAggregations.reduce((sum, agg) => sum + agg.dataPoints, 0),
            electrical: {
                activePower: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.activePower || 0), 0),
                reactivePower: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.reactivePower || 0), 0),
                totalEnergy: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.totalEnergy || 0), 0),
                avgVoltage: this.averageFromAggregations(validAggregations, 'electrical.avgVoltage'),
                avgFrequency: this.averageFromAggregations(validAggregations, 'electrical.avgFrequency')
            },
            performance: {
                avgEfficiency: this.averageFromAggregations(validAggregations, 'performance.avgEfficiency'),
                avgAvailability: this.averageFromAggregations(validAggregations, 'performance.avgAvailability'),
                avgCapacityFactor: this.averageFromAggregations(validAggregations, 'performance.avgCapacityFactor')
            },
            environmental: {
                avgTemperature: this.averageFromAggregations(validAggregations, 'environmental.avgTemperature'),
                avgHumidity: this.averageFromAggregations(validAggregations, 'environmental.avgHumidity'),
                maxSolarIrradiance: Math.max(...validAggregations.map(agg => agg.environmental?.maxSolarIrradiance || 0)),
                maxWindSpeed: Math.max(...validAggregations.map(agg => agg.environmental?.maxWindSpeed || 0))
            },
            equipment: {
                total: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.total || 0), 0),
                operational: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.operational || 0), 0),
                maintenance: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.maintenance || 0), 0),
                fault: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.fault || 0), 0)
            },
            plants: {
                total: plants.length,
                byType: this.groupPlantsByType(plants)
            }
        };
    }

    /**
     * Aggregate state-level data
     */
    aggregateStateData(stateAggregations, states) {
        const validAggregations = stateAggregations.filter(agg => agg.dataPoints > 0);

        if (validAggregations.length === 0) {
            return this.getEmptyAggregation('sector');
        }

        return {
            level: 'sector',
            dataPoints: validAggregations.reduce((sum, agg) => sum + agg.dataPoints, 0),
            electrical: {
                activePower: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.activePower || 0), 0),
                reactivePower: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.reactivePower || 0), 0),
                totalEnergy: validAggregations.reduce((sum, agg) => sum + (agg.electrical?.totalEnergy || 0), 0),
                avgVoltage: this.averageFromAggregations(validAggregations, 'electrical.avgVoltage'),
                avgFrequency: this.averageFromAggregations(validAggregations, 'electrical.avgFrequency')
            },
            performance: {
                avgEfficiency: this.averageFromAggregations(validAggregations, 'performance.avgEfficiency'),
                avgAvailability: this.averageFromAggregations(validAggregations, 'performance.avgAvailability'),
                avgCapacityFactor: this.averageFromAggregations(validAggregations, 'performance.avgCapacityFactor')
            },
            environmental: {
                avgTemperature: this.averageFromAggregations(validAggregations, 'environmental.avgTemperature'),
                avgHumidity: this.averageFromAggregations(validAggregations, 'environmental.avgHumidity'),
                maxSolarIrradiance: Math.max(...validAggregations.map(agg => agg.environmental?.maxSolarIrradiance || 0)),
                maxWindSpeed: Math.max(...validAggregations.map(agg => agg.environmental?.maxWindSpeed || 0))
            },
            equipment: {
                total: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.total || 0), 0),
                operational: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.operational || 0), 0),
                maintenance: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.maintenance || 0), 0),
                fault: validAggregations.reduce((sum, agg) => sum + (agg.equipment?.fault || 0), 0)
            },
            plants: {
                total: validAggregations.reduce((sum, agg) => sum + (agg.plants?.total || 0), 0),
                byType: this.aggregatePlantTypes(validAggregations)
            },
            states: {
                total: states.length,
                active: validAggregations.length
            }
        };
    }

    // Helper methods
    getTimeRange(timeWindow) {
        const end = new Date();
        let start;

        switch (timeWindow) {
            case '15m':
                start = new Date(end.getTime() - 15 * 60 * 1000);
                break;
            case '1h':
                start = new Date(end.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                break;
            default:
                start = new Date(end.getTime() - 60 * 60 * 1000);
        }

        return { start, end };
    }

    getEmptyAggregation(level, id = null) {
        return {
            level,
            id,
            dataPoints: 0,
            electrical: { activePower: 0, reactivePower: 0, totalEnergy: 0, avgVoltage: 0, avgFrequency: 0 },
            performance: { avgEfficiency: 0, avgAvailability: 0, avgCapacityFactor: 0 },
            environmental: { avgTemperature: 0, avgHumidity: 0, maxSolarIrradiance: 0, maxWindSpeed: 0 },
            equipment: { total: 0, operational: 0, maintenance: 0, fault: 0 },
            lastUpdated: new Date()
        };
    }

    sumValues(data, path) {
        return data.reduce((sum, item) => {
            const value = this.getNestedValue(item, path);
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
    }

    averageValues(data, path) {
        const values = data.map(item => this.getNestedValue(item, path)).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    maxValue(data, path) {
        const values = data.map(item => this.getNestedValue(item, path)).filter(v => typeof v === 'number');
        return values.length > 0 ? Math.max(...values) : 0;
    }

    averageFromAggregations(aggregations, path) {
        const values = aggregations.map(agg => this.getNestedValue(agg, path)).filter(v => typeof v === 'number');
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    groupPlantsByType(plants) {
        return plants.reduce((acc, plant) => {
            const type = plant.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
    }

    aggregatePlantTypes(aggregations) {
        const combined = {};
        aggregations.forEach(agg => {
            if (agg.plants?.byType) {
                Object.entries(agg.plants.byType).forEach(([type, count]) => {
                    combined[type] = (combined[type] || 0) + count;
                });
            }
        });
        return combined;
    }

    /**
     * Clear cache for specific entity
     */
    async clearCache(level, id, timeWindow = null) {
        if (!this.redis) return;

        try {
            if (timeWindow) {
                const cacheKey = `${this.cachePrefix}:${level}:${id}:${timeWindow}`;
                await this.redis.del(cacheKey);
            } else {
                // Clear all time windows for this entity
                const pattern = `${this.cachePrefix}:${level}:${id}:*`;
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(keys);
                }
            }
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!this.redis) return { enabled: false };

        try {
            const keys = await this.redis.keys(`${this.cachePrefix}:*`);
            const stats = {
                enabled: true,
                totalKeys: keys.length,
                keysByLevel: {},
                keysByTimeWindow: {}
            };

            keys.forEach(key => {
                const parts = key.split(':');
                if (parts.length >= 3) {
                    const level = parts[2];
                    stats.keysByLevel[level] = (stats.keysByLevel[level] || 0) + 1;
                }
                if (parts.length >= 5) {
                    const timeWindow = parts[4];
                    stats.keysByTimeWindow[timeWindow] = (stats.keysByTimeWindow[timeWindow] || 0) + 1;
                }
            });

            return stats;
        } catch (error) {
            console.error('❌ Error getting cache stats:', error);
            return { enabled: true, error: error.message };
        }
    }
}

// Create singleton instance
const aggregationEngine = new AggregationEngine();

module.exports = aggregationEngine;
