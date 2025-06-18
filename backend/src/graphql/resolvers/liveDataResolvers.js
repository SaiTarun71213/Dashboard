const { Reading, Equipment, Plant, State } = require('../../models');

/**
 * LIVE DATA RESOLVERS
 * Handles real-time data queries and subscriptions
 * Provides live readings and aggregated summaries
 */

const liveDataResolvers = {
  Query: {
    /**
     * Get latest readings for equipment
     */
    async getLiveReadings(parent, { equipmentIds, plantIds, limit }, context) {
      try {
        const { user, isAuthenticated } = context;

        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Build filter based on user access
        const filter = {};

        if (equipmentIds && equipmentIds.length > 0) {
          filter.equipment = { $in: equipmentIds };
        }

        if (plantIds && plantIds.length > 0) {
          filter.plant = { $in: plantIds };
        }

        // Apply user access scope
        if (user.role !== 'Super Admin' && user.accessScope.plants.length > 0) {
          const userPlantIds = user.accessScope.plants.map(p => p._id);
          if (filter.plant) {
            filter.plant.$in = filter.plant.$in.filter(id =>
              userPlantIds.some(plantId => plantId.toString() === id.toString())
            );
          } else {
            filter.plant = { $in: userPlantIds };
          }
        }

        // Get latest readings
        const readings = await Reading.find(filter)
          .sort({ timestamp: -1 })
          .limit(limit)
          .populate('equipment', 'name type')
          .populate('plant', 'name type')
          .lean();

        return readings.map(reading => ({
          id: reading._id,
          equipment: reading.equipment._id,
          plant: reading.plant._id,
          timestamp: reading.timestamp,
          activePower: reading.electrical?.activePower || 0,
          efficiency: reading.performance?.efficiency || 0,
          availability: reading.performance?.availability || 0,
          status: reading.equipment?.performance?.currentStatus || 'Unknown'
        }));

      } catch (error) {
        console.error('Get live readings error:', error);
        throw new Error('Failed to get live readings');
      }
    },

    /**
     * Get plant summaries
     */
    async getPlantSummaries(parent, { stateIds, plantTypes }, context) {
      try {
        const { user, isAuthenticated } = context;

        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Build plant filter
        const plantFilter = {};

        if (stateIds && stateIds.length > 0) {
          plantFilter['location.state'] = { $in: stateIds };
        }

        if (plantTypes && plantTypes.length > 0) {
          plantFilter.type = { $in: plantTypes };
        }

        // Apply user access scope
        if (user.role !== 'Super Admin' && user.accessScope.plants.length > 0) {
          const userPlantIds = user.accessScope.plants.map(p => p._id);
          plantFilter._id = { $in: userPlantIds };
        }

        // Get plants with aggregated data
        const plantSummaries = await Plant.aggregate([
          { $match: plantFilter },
          {
            $lookup: {
              from: 'equipment',
              localField: '_id',
              foreignField: 'plant',
              as: 'equipment'
            }
          },
          {
            $lookup: {
              from: 'readings',
              let: { plantId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$plant', '$$plantId'] },
                    timestamp: {
                      $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                    }
                  }
                },
                { $sort: { timestamp: -1 } },
                { $limit: 100 }
              ],
              as: 'recentReadings'
            }
          },
          {
            $project: {
              name: 1,
              type: 1,
              totalPower: {
                $avg: '$recentReadings.electrical.activePower'
              },
              avgEfficiency: {
                $avg: '$recentReadings.performance.efficiency'
              },
              avgAvailability: {
                $avg: '$recentReadings.performance.availability'
              },
              equipmentCount: { $size: '$equipment' },
              operationalCount: {
                $size: {
                  $filter: {
                    input: '$equipment',
                    cond: { $eq: ['$$this.performance.currentStatus', 'Operational'] }
                  }
                }
              },
              lastUpdated: { $max: '$recentReadings.timestamp' }
            }
          }
        ]);

        return plantSummaries.map(summary => ({
          id: summary._id,
          name: summary.name,
          type: summary.type,
          totalPower: Math.round(summary.totalPower || 0),
          avgEfficiency: Math.round((summary.avgEfficiency || 0) * 100) / 100,
          avgAvailability: Math.round((summary.avgAvailability || 0) * 100) / 100,
          equipmentCount: summary.equipmentCount,
          operationalCount: summary.operationalCount,
          lastUpdated: summary.lastUpdated || new Date()
        }));

      } catch (error) {
        console.error('Get plant summaries error:', error);
        throw new Error('Failed to get plant summaries');
      }
    },

    /**
     * Get state summaries
     */
    async getStateSummaries(parent, args, context) {
      try {
        const { user, isAuthenticated } = context;

        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Build state filter based on user access
        const stateFilter = {};
        if (user.role !== 'Super Admin' && user.accessScope.states.length > 0) {
          stateFilter._id = { $in: user.accessScope.states.map(s => s._id) };
        }

        // Get states with aggregated data
        const stateSummaries = await State.aggregate([
          { $match: stateFilter },
          {
            $lookup: {
              from: 'plants',
              localField: '_id',
              foreignField: 'location.state',
              as: 'plants'
            }
          },
          {
            $lookup: {
              from: 'readings',
              let: { stateId: '$_id' },
              pipeline: [
                {
                  $lookup: {
                    from: 'plants',
                    localField: 'plant',
                    foreignField: '_id',
                    as: 'plantInfo'
                  }
                },
                {
                  $match: {
                    $expr: {
                      $eq: [{ $arrayElemAt: ['$plantInfo.location.state', 0] }, '$$stateId']
                    },
                    timestamp: {
                      $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                    }
                  }
                },
                { $sort: { timestamp: -1 } },
                { $limit: 1000 }
              ],
              as: 'recentReadings'
            }
          },
          {
            $project: {
              name: 1,
              totalPower: {
                $sum: '$recentReadings.electrical.activePower'
              },
              totalCapacity: '$energyProfile.totalCapacity',
              avgEfficiency: {
                $avg: '$recentReadings.performance.efficiency'
              },
              plantCount: { $size: '$plants' },
              operationalPlants: {
                $size: {
                  $filter: {
                    input: '$plants',
                    cond: { $eq: ['$$this.status', 'Operational'] }
                  }
                }
              },
              lastUpdated: { $max: '$recentReadings.timestamp' }
            }
          }
        ]);

        return stateSummaries.map(summary => ({
          id: summary._id,
          name: summary.name,
          totalPower: Math.round(summary.totalPower || 0),
          totalCapacity: summary.totalCapacity || 0,
          avgEfficiency: Math.round((summary.avgEfficiency || 0) * 100) / 100,
          plantCount: summary.plantCount,
          operationalPlants: summary.operationalPlants,
          lastUpdated: summary.lastUpdated || new Date()
        }));

      } catch (error) {
        console.error('Get state summaries error:', error);
        throw new Error('Failed to get state summaries');
      }
    }
  },

  Subscription: {
    /**
     * Subscribe to live reading updates
     */
    liveReadingUpdates: {
      // This will be implemented with WebSocket/Redis pub-sub
      subscribe: () => {
        // Placeholder for subscription implementation
        throw new Error('Live reading subscriptions not yet implemented');
      }
    },

    /**
     * Subscribe to plant summary updates
     */
    plantSummaryUpdates: {
      // This will be implemented with WebSocket/Redis pub-sub
      subscribe: () => {
        // Placeholder for subscription implementation
        throw new Error('Plant summary subscriptions not yet implemented');
      }
    },

    /**
     * Subscribe to state summary updates
     */
    stateSummaryUpdates: {
      // This will be implemented with WebSocket/Redis pub-sub
      subscribe: () => {
        // Placeholder for subscription implementation
        throw new Error('State summary subscriptions not yet implemented');
      }
    }
  },

  LiveReading: {
    /**
     * Resolve equipment details for live reading
     */
    async equipment(parent) {
      try {
        const equipment = await Equipment.findById(parent.equipment)
          .select('name type specifications')
          .lean();
        return equipment;
      } catch (error) {
        console.error('Resolve live reading equipment error:', error);
        return null;
      }
    },

    /**
     * Resolve plant details for live reading
     */
    async plant(parent) {
      try {
        const plant = await Plant.findById(parent.plant)
          .select('name type location')
          .lean();
        return plant;
      } catch (error) {
        console.error('Resolve live reading plant error:', error);
        return null;
      }
    }
  },

  PlantSummary: {
    // No additional resolvers needed for now
  },

  StateSummary: {
    // No additional resolvers needed for now
  }
};

module.exports = liveDataResolvers;
