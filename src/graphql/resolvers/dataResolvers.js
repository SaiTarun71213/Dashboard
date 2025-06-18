const { Reading, Equipment, Plant, State, ChartConfiguration } = require('../../models');

/**
 * DATA RESOLVERS
 * Handles chart data queries and transformations
 * Provides data in format suitable for Highcharts rendering
 */

const dataResolvers = {
  Query: {
    /**
     * Get chart data based on configuration
     */
    async getChartData(parent, { configurationId, filters }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Get chart configuration
        const config = await ChartConfiguration.findById(configurationId);
        if (!config) {
          throw new Error('Chart configuration not found');
        }

        // Build data query based on level and configuration
        const chartData = await buildChartData(config, filters, user);
        
        return {
          series: chartData.series,
          categories: chartData.categories,
          metadata: {
            level: config.level,
            chartType: config.chartType,
            xAxis: config.xAxis,
            yAxis: config.yAxis,
            totalDataPoints: chartData.totalDataPoints
          },
          lastUpdated: new Date()
        };

      } catch (error) {
        console.error('Get chart data error:', error);
        throw new Error('Failed to get chart data');
      }
    },

    /**
     * Get energy trends data
     */
    async getEnergyTrends(parent, { level, entityIds, timeRange, startDate, endDate }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Build date range
        const dateRange = buildDateRange(timeRange, startDate, endDate);
        
        // Get trend data based on level
        const trendData = await getTrendData(level, entityIds, dateRange, user);
        
        return {
          series: trendData.series,
          categories: trendData.categories,
          metadata: {
            level,
            timeRange,
            dateRange,
            entityCount: entityIds.length
          },
          lastUpdated: new Date()
        };

      } catch (error) {
        console.error('Get energy trends error:', error);
        throw new Error('Failed to get energy trends');
      }
    },

    /**
     * Get performance comparison data
     */
    async getPerformanceComparison(parent, { level, entityIds, metric, timeRange }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Get comparison data
        const comparisonData = await getComparisonData(level, entityIds, metric, timeRange, user);
        
        return {
          series: comparisonData.series,
          categories: comparisonData.categories,
          metadata: {
            level,
            metric,
            timeRange,
            entityCount: entityIds.length
          },
          lastUpdated: new Date()
        };

      } catch (error) {
        console.error('Get performance comparison error:', error);
        throw new Error('Failed to get performance comparison');
      }
    }
  },

  Subscription: {
    /**
     * Subscribe to chart data updates
     */
    chartDataUpdates: {
      // This will be implemented with WebSocket/Redis pub-sub
      subscribe: () => {
        // Placeholder for subscription implementation
        throw new Error('Chart data subscriptions not yet implemented');
      }
    }
  },

  ChartData: {
    /**
     * Resolve additional metadata for chart data
     */
    async metadata(parent) {
      return {
        ...parent.metadata,
        generatedAt: new Date(),
        version: '1.0'
      };
    }
  }
};

/**
 * Build chart data based on configuration and filters
 */
async function buildChartData(config, filters, user) {
  const { level, chartType, xAxis, yAxis } = config;
  
  // Apply user access filters
  const userFilter = getUserAccessFilter(user, level);
  
  // Build entity filter
  const entityFilter = buildEntityFilter(filters, userFilter);
  
  // Build time filter
  const timeFilter = buildTimeFilter(filters);
  
  let data = [];
  let categories = [];
  
  switch (level) {
    case 'SECTOR':
      data = await getSectorData(entityFilter, timeFilter, xAxis, yAxis);
      break;
    case 'STATE':
      data = await getStateData(entityFilter, timeFilter, xAxis, yAxis);
      break;
    case 'PLANT':
      data = await getPlantData(entityFilter, timeFilter, xAxis, yAxis);
      break;
    case 'EQUIPMENT':
      data = await getEquipmentData(entityFilter, timeFilter, xAxis, yAxis);
      break;
  }
  
  // Transform data for chart type
  const transformedData = transformDataForChartType(data, chartType, xAxis, yAxis);
  
  return {
    series: transformedData.series,
    categories: transformedData.categories,
    totalDataPoints: data.length
  };
}

/**
 * Get sector-level data (states)
 */
async function getSectorData(entityFilter, timeFilter, xAxis, yAxis) {
  // Placeholder implementation
  const states = await State.find(entityFilter).lean();
  
  return states.map(state => ({
    x: getFieldValue(state, xAxis.field),
    y: getFieldValue(state, yAxis.field),
    label: state.name,
    metadata: { id: state._id, type: 'state' }
  }));
}

/**
 * Get state-level data (plants)
 */
async function getStateData(entityFilter, timeFilter, xAxis, yAxis) {
  // Placeholder implementation
  const plants = await Plant.find(entityFilter).lean();
  
  return plants.map(plant => ({
    x: getFieldValue(plant, xAxis.field),
    y: getFieldValue(plant, yAxis.field),
    label: plant.name,
    metadata: { id: plant._id, type: 'plant' }
  }));
}

/**
 * Get plant-level data (equipment)
 */
async function getPlantData(entityFilter, timeFilter, xAxis, yAxis) {
  // Placeholder implementation
  const equipment = await Equipment.find(entityFilter).lean();
  
  return equipment.map(eq => ({
    x: getFieldValue(eq, xAxis.field),
    y: getFieldValue(eq, yAxis.field),
    label: eq.name,
    metadata: { id: eq._id, type: 'equipment' }
  }));
}

/**
 * Get equipment-level data (readings)
 */
async function getEquipmentData(entityFilter, timeFilter, xAxis, yAxis) {
  // Placeholder implementation
  const readings = await Reading.find({
    ...entityFilter,
    ...timeFilter
  }).lean();
  
  return readings.map(reading => ({
    x: getFieldValue(reading, xAxis.field),
    y: getFieldValue(reading, yAxis.field),
    label: reading.timestamp.toISOString(),
    metadata: { id: reading._id, type: 'reading' }
  }));
}

/**
 * Helper functions
 */
function getUserAccessFilter(user, level) {
  if (user.role === 'Super Admin') {
    return {};
  }
  
  switch (level) {
    case 'SECTOR':
      return { _id: { $in: user.accessScope.states.map(s => s._id) } };
    case 'STATE':
    case 'PLANT':
      return { _id: { $in: user.accessScope.plants.map(p => p._id) } };
    case 'EQUIPMENT':
      return { plant: { $in: user.accessScope.plants.map(p => p._id) } };
    default:
      return {};
  }
}

function buildEntityFilter(filters, userFilter) {
  const filter = { ...userFilter };
  
  if (filters.entityIds && filters.entityIds.length > 0) {
    filter._id = { $in: filters.entityIds };
  }
  
  if (filters.customFilters) {
    Object.assign(filter, filters.customFilters);
  }
  
  return filter;
}

function buildTimeFilter(filters) {
  const timeFilter = {};
  
  if (filters.startDate || filters.endDate) {
    timeFilter.timestamp = {};
    if (filters.startDate) timeFilter.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) timeFilter.timestamp.$lte = new Date(filters.endDate);
  }
  
  return timeFilter;
}

function buildDateRange(timeRange, startDate, endDate) {
  const end = endDate ? new Date(endDate) : new Date();
  let start;
  
  switch (timeRange) {
    case 'HOURLY':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      break;
    case 'DAILY':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      break;
    case 'WEEKLY':
      start = new Date(end.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
      break;
    case 'MONTHLY':
      start = new Date(end.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
      break;
    default:
      start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return { start, end };
}

function getFieldValue(object, fieldPath) {
  return fieldPath.split('.').reduce((obj, key) => obj && obj[key], object) || 0;
}

function transformDataForChartType(data, chartType, xAxis, yAxis) {
  switch (chartType) {
    case 'PIE':
      return {
        series: [{
          name: yAxis.label,
          data: data.map(item => ({
            name: item.label,
            y: item.y,
            color: generateColor(item.label)
          }))
        }],
        categories: []
      };
      
    case 'BAR':
    case 'COLUMN':
    case 'LINE':
    case 'AREA':
      return {
        series: [{
          name: yAxis.label,
          data: data.map(item => item.y)
        }],
        categories: data.map(item => item.label)
      };
      
    case 'SCATTER':
    case 'BUBBLE':
      return {
        series: [{
          name: `${xAxis.label} vs ${yAxis.label}`,
          data: data.map(item => [item.x, item.y])
        }],
        categories: []
      };
      
    default:
      return {
        series: [],
        categories: []
      };
  }
}

function generateColor(label) {
  // Simple color generation based on label hash
  const hash = label.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f'];
  return colors[Math.abs(hash) % colors.length];
}

// Placeholder functions for trend and comparison data
async function getTrendData(level, entityIds, dateRange, user) {
  return { series: [], categories: [] };
}

async function getComparisonData(level, entityIds, metric, timeRange, user) {
  return { series: [], categories: [] };
}

module.exports = dataResolvers;
