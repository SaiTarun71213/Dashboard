const { ChartConfiguration } = require('../../models');

/**
 * CHART CONFIGURATION RESOLVERS
 * Handles CRUD operations for chart configurations
 * Manages chart templates and user-specific chart settings
 */

const chartResolvers = {
  Query: {
    /**
     * Get all chart configurations for a user
     */
    async getChartConfigurations(parent, { level }, context) {
      try {
        const { user } = context;
        
        const filter = { createdBy: user._id };
        if (level) {
          filter.level = level;
        }

        const charts = await ChartConfiguration.find(filter)
          .sort({ updatedAt: -1 })
          .lean();

        return charts;

      } catch (error) {
        console.error('Get chart configurations error:', error);
        throw new Error('Failed to get chart configurations');
      }
    },

    /**
     * Get a specific chart configuration
     */
    async getChartConfiguration(parent, { id }, context) {
      try {
        const { user } = context;
        
        const chart = await ChartConfiguration.findOne({
          _id: id,
          createdBy: user._id
        }).lean();

        if (!chart) {
          throw new Error('Chart configuration not found');
        }

        return chart;

      } catch (error) {
        console.error('Get chart configuration error:', error);
        throw new Error('Failed to get chart configuration');
      }
    }
  },

  Mutation: {
    /**
     * Create a new chart configuration
     */
    async createChartConfiguration(parent, { input }, context) {
      try {
        const { user } = context;

        // Validate chart configuration
        const validationResult = validateChartConfiguration(input);
        if (!validationResult.isValid) {
          throw new Error(`Invalid chart configuration: ${validationResult.errors.join(', ')}`);
        }

        const chartData = {
          ...input,
          createdBy: user._id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const chart = new ChartConfiguration(chartData);
        await chart.save();

        return chart.toObject();

      } catch (error) {
        console.error('Create chart configuration error:', error);
        throw new Error('Failed to create chart configuration');
      }
    },

    /**
     * Update an existing chart configuration
     */
    async updateChartConfiguration(parent, { id, input }, context) {
      try {
        const { user } = context;

        // Validate chart configuration
        const validationResult = validateChartConfiguration(input);
        if (!validationResult.isValid) {
          throw new Error(`Invalid chart configuration: ${validationResult.errors.join(', ')}`);
        }

        const chart = await ChartConfiguration.findOneAndUpdate(
          { _id: id, createdBy: user._id },
          { 
            ...input, 
            updatedAt: new Date() 
          },
          { new: true, runValidators: true }
        );

        if (!chart) {
          throw new Error('Chart configuration not found');
        }

        return chart.toObject();

      } catch (error) {
        console.error('Update chart configuration error:', error);
        throw new Error('Failed to update chart configuration');
      }
    },

    /**
     * Delete a chart configuration
     */
    async deleteChartConfiguration(parent, { id }, context) {
      try {
        const { user } = context;

        const result = await ChartConfiguration.deleteOne({
          _id: id,
          createdBy: user._id
        });

        if (result.deletedCount === 0) {
          throw new Error('Chart configuration not found');
        }

        return true;

      } catch (error) {
        console.error('Delete chart configuration error:', error);
        throw new Error('Failed to delete chart configuration');
      }
    }
  },

  ChartConfiguration: {
    /**
     * Resolve the creator of the chart
     */
    async createdBy(parent) {
      try {
        const { User } = require('../../models');
        const user = await User.findById(parent.createdBy)
          .select('personalInfo.firstName personalInfo.lastName personalInfo.email')
          .lean();
        
        return user;
      } catch (error) {
        console.error('Resolve chart creator error:', error);
        return null;
      }
    }
  }
};

/**
 * Validate chart configuration input
 */
function validateChartConfiguration(input) {
  const errors = [];

  // Required fields validation
  if (!input.name || input.name.trim().length === 0) {
    errors.push('Chart name is required');
  }

  if (!input.level) {
    errors.push('Chart level is required');
  }

  if (!input.chartType) {
    errors.push('Chart type is required');
  }

  if (!input.xAxis || !input.xAxis.field) {
    errors.push('X-axis field is required');
  }

  if (!input.yAxis || !input.yAxis.field) {
    errors.push('Y-axis field is required');
  }

  // Chart type specific validations
  if (input.chartType === 'PIE') {
    // For pie charts, ensure we have categorical x-axis and numeric y-axis
    if (input.yAxis && input.yAxis.type !== 'number') {
      errors.push('Pie charts require numeric Y-axis values');
    }
  }

  if (['BAR', 'LINE', 'COLUMN', 'AREA'].includes(input.chartType)) {
    // For these chart types, ensure proper axis configuration
    if (input.xAxis && input.yAxis && input.xAxis.field === input.yAxis.field) {
      errors.push('X-axis and Y-axis cannot use the same field');
    }
  }

  // Time range validation
  if (input.timeRange && !['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(input.timeRange)) {
    errors.push('Invalid time range specified');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = chartResolvers;
