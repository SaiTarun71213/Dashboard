const { State, Plant, Equipment } = require('../../models');

/**
 * PARAMETER DISCOVERY RESOLVERS
 * Handles dynamic parameter discovery for chart configuration
 * Provides available fields and entities based on selected level
 */

const parameterResolvers = {
  Query: {
    /**
     * Get available parameters for a specific level
     */
    async getLevelParameters(parent, { level }, context) {
      try {
        const { user } = context;
        
        // Define field mappings for each level
        const levelFieldMappings = {
          SECTOR: {
            fields: [
              { field: 'name', label: 'State Name', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: true },
              { field: 'energyProfile.totalCapacity', label: 'Total Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'energyProfile.renewableCapacity', label: 'Renewable Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'energyProfile.solarCapacity', label: 'Solar Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'energyProfile.windCapacity', label: 'Wind Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'energyProfile.hydroCapacity', label: 'Hydro Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'plantCount', label: 'Number of Plants', type: 'number', aggregationType: 'COUNT', isNumeric: true, isRequired: false },
            ],
            filterFields: [
              { field: 'name', label: 'State Name', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'region', label: 'Region', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
            ]
          },
          
          STATE: {
            fields: [
              { field: 'name', label: 'Plant Name', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: true },
              { field: 'type', label: 'Plant Type', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'technical.capacity.installed', label: 'Installed Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'technical.capacity.operational', label: 'Operational Capacity', type: 'number', unit: 'MW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'performance.efficiency', label: 'Efficiency', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'performance.availability', label: 'Availability', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'performance.capacityFactor', label: 'Capacity Factor', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'equipmentCount', label: 'Equipment Count', type: 'number', aggregationType: 'COUNT', isNumeric: true, isRequired: false },
            ],
            filterFields: [
              { field: 'type', label: 'Plant Type', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'status', label: 'Status', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'location.state', label: 'State', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
            ]
          },
          
          PLANT: {
            fields: [
              { field: 'name', label: 'Equipment Name', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: true },
              { field: 'type', label: 'Equipment Type', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'specifications.ratings.power', label: 'Rated Power', type: 'number', unit: 'kW', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'performance.efficiency', label: 'Efficiency', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'performance.availability', label: 'Availability', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'performance.currentStatus', label: 'Current Status', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'maintenance.totalDowntime', label: 'Total Downtime', type: 'number', unit: 'hours', aggregationType: 'SUM', isNumeric: true, isRequired: false },
            ],
            filterFields: [
              { field: 'type', label: 'Equipment Type', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'performance.currentStatus', label: 'Status', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'manufacturer', label: 'Manufacturer', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
            ]
          },
          
          EQUIPMENT: {
            fields: [
              { field: 'timestamp', label: 'Time', type: 'datetime', aggregationType: 'COUNT', isNumeric: false, isRequired: true },
              { field: 'electrical.activePower', label: 'Active Power', type: 'number', unit: 'kW', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'electrical.reactivePower', label: 'Reactive Power', type: 'number', unit: 'kVAR', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'electrical.voltage.l1', label: 'Voltage L1', type: 'number', unit: 'V', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'electrical.current.l1', label: 'Current L1', type: 'number', unit: 'A', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'electrical.frequency', label: 'Frequency', type: 'number', unit: 'Hz', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'electrical.energy.totalGeneration', label: 'Total Energy', type: 'number', unit: 'kWh', aggregationType: 'SUM', isNumeric: true, isRequired: false },
              { field: 'performance.efficiency', label: 'Efficiency', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'performance.availability', label: 'Availability', type: 'number', unit: '%', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'environmental.weather.solarIrradiance', label: 'Solar Irradiance', type: 'number', unit: 'W/m²', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'environmental.weather.windSpeed', label: 'Wind Speed', type: 'number', unit: 'm/s', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
              { field: 'environmental.weather.temperature.ambient', label: 'Ambient Temperature', type: 'number', unit: '°C', aggregationType: 'AVERAGE', isNumeric: true, isRequired: false },
            ],
            filterFields: [
              { field: 'equipment', label: 'Equipment', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
              { field: 'plant', label: 'Plant', type: 'string', aggregationType: 'COUNT', isNumeric: false, isRequired: false },
            ]
          }
        };

        const levelConfig = levelFieldMappings[level];
        if (!levelConfig) {
          throw new Error(`Invalid level: ${level}`);
        }

        return {
          level,
          fields: levelConfig.fields,
          filterFields: levelConfig.filterFields
        };

      } catch (error) {
        console.error('Get level parameters error:', error);
        throw new Error('Failed to get level parameters');
      }
    },

    /**
     * Get available entities for a specific level
     */
    async getAvailableEntities(parent, { level, parentId }, context) {
      try {
        const { user } = context;
        let entities = [];

        switch (level) {
          case 'SECTOR':
            // Return all states user has access to
            const userFilter = user.role === 'Super Admin' ? {} : 
              { _id: { $in: user.accessScope.states.map(s => s._id) } };
            
            const states = await State.find(userFilter)
              .select('_id name code region energyProfile')
              .lean();
            
            entities = states.map(state => ({
              id: state._id,
              name: state.name,
              code: state.code,
              region: state.region,
              metadata: state.energyProfile
            }));
            break;

          case 'STATE':
            // Return plants in the selected state
            const stateFilter = parentId ? { 'location.state': parentId } : {};
            const plantUserFilter = user.role === 'Super Admin' ? stateFilter : 
              { ...stateFilter, _id: { $in: user.accessScope.plants.map(p => p._id) } };
            
            const plants = await Plant.find(plantUserFilter)
              .select('_id name type status technical.capacity location')
              .lean();
            
            entities = plants.map(plant => ({
              id: plant._id,
              name: plant.name,
              type: plant.type,
              status: plant.status,
              metadata: {
                capacity: plant.technical?.capacity,
                location: plant.location
              }
            }));
            break;

          case 'PLANT':
            // Return equipment in the selected plant
            const equipmentFilter = parentId ? { plant: parentId } : {};
            const equipment = await Equipment.find(equipmentFilter)
              .select('_id name type specifications.ratings performance')
              .lean();
            
            entities = equipment.map(eq => ({
              id: eq._id,
              name: eq.name,
              type: eq.type,
              metadata: {
                ratings: eq.specifications?.ratings,
                performance: eq.performance
              }
            }));
            break;

          case 'EQUIPMENT':
            // For equipment level, return the equipment itself
            if (parentId) {
              const singleEquipment = await Equipment.findById(parentId)
                .select('_id name type specifications')
                .lean();
              
              if (singleEquipment) {
                entities = [{
                  id: singleEquipment._id,
                  name: singleEquipment.name,
                  type: singleEquipment.type,
                  metadata: singleEquipment.specifications
                }];
              }
            }
            break;

          default:
            throw new Error(`Invalid level: ${level}`);
        }

        return entities;

      } catch (error) {
        console.error('Get available entities error:', error);
        throw new Error('Failed to get available entities');
      }
    }
  }
};

module.exports = parameterResolvers;
