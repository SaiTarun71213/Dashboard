const mongoose = require('mongoose');

/**
 * CHART CONFIGURATION MODEL
 * Stores user-defined chart configurations for dynamic dashboard creation
 * Supports all chart types with flexible parameter mapping
 */

const chartParameterSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['string', 'number', 'datetime', 'boolean'],
    default: 'string'
  },
  unit: {
    type: String,
    trim: true
  },
  aggregationType: {
    type: String,
    enum: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT'],
    default: 'SUM'
  }
}, { _id: false });

const chartConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  level: {
    type: String,
    required: true,
    enum: ['SECTOR', 'STATE', 'PLANT', 'EQUIPMENT'],
    index: true
  },
  chartType: {
    type: String,
    required: true,
    enum: [
      'line', 'spline', 'area', 'areaspline', 'column', 'bar',
      'pie', 'scatter', 'bubble', 'gauge', 'solidgauge',
      'heatmap', 'treemap', 'funnel', 'pyramid'
    ],
    index: true
  },
  xAxis: {
    type: chartParameterSchema,
    required: true
  },
  yAxis: {
    type: chartParameterSchema,
    required: true
  },
  series: [{
    name: {
      type: String,
      required: true,
      description: 'Series name'
    },
    field: {
      type: String,
      required: true,
      description: 'Data field for this series'
    },
    aggregation: {
      type: String,
      enum: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT', 'LATEST'],
      default: 'AVERAGE'
    },
    color: {
      type: String,
      default: '#7cb5ec'
    },
    type: {
      type: String,
      enum: ['line', 'spline', 'area', 'areaspline', 'column', 'bar', 'scatter'],
      description: 'Override chart type for this series'
    },
    yAxis: {
      type: Number,
      default: 0,
      description: 'Y-axis index for this series'
    }
  }],
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timeRange: {
    type: String,
    enum: ['15m', '1h', '4h', '24h', '7d', '30d'],
    default: '1h'
  },
  refreshInterval: {
    type: Number,
    default: 30000,
    min: 5000,
    max: 300000,
    description: 'Auto-refresh interval in milliseconds'
  },
  realTime: {
    enabled: {
      type: Boolean,
      default: true,
      description: 'Enable real-time updates via WebSocket'
    },
    maxDataPoints: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000,
      description: 'Maximum data points to display'
    }
  },
  chartOptions: {
    colors: [{
      type: String,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    }],
    showLegend: {
      type: Boolean,
      default: true
    },
    showDataLabels: {
      type: Boolean,
      default: false
    },
    enableAnimation: {
      type: Boolean,
      default: true
    },
    customOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  isTemplate: {
    type: Boolean,
    default: false,
    index: true
  },
  templateCategory: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['VIEW', 'EDIT'],
      default: 'VIEW'
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
chartConfigurationSchema.index({ createdBy: 1, level: 1 });
chartConfigurationSchema.index({ createdBy: 1, chartType: 1 });
chartConfigurationSchema.index({ isTemplate: 1, level: 1 });
chartConfigurationSchema.index({ tags: 1 });
chartConfigurationSchema.index({ usageCount: -1 });

// Virtual for chart configuration summary
chartConfigurationSchema.virtual('summary').get(function () {
  return {
    id: this._id,
    name: this.name,
    level: this.level,
    chartType: this.chartType,
    xAxisLabel: this.xAxis.label,
    yAxisLabel: this.yAxis.label,
    isTemplate: this.isTemplate,
    usageCount: this.usageCount,
    lastUsed: this.lastUsed
  };
});

// Method to increment usage count
chartConfigurationSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to create template from configuration
chartConfigurationSchema.methods.createTemplate = function (templateName, category) {
  const templateData = this.toObject();
  delete templateData._id;
  delete templateData.createdAt;
  delete templateData.updatedAt;

  templateData.name = templateName || `${this.name} Template`;
  templateData.isTemplate = true;
  templateData.templateCategory = category;
  templateData.usageCount = 0;
  templateData.lastUsed = null;

  return new this.constructor(templateData);
};

// Method to validate chart configuration compatibility
chartConfigurationSchema.methods.isCompatibleWith = function (level, entityType) {
  // Check if chart configuration can be used with the specified level and entity type
  if (this.level !== level) {
    return false;
  }

  // Additional compatibility checks can be added here
  // For example, checking if the fields exist in the target entity schema

  return true;
};

// Static method to get popular templates
chartConfigurationSchema.statics.getPopularTemplates = function (level, limit = 10) {
  return this.find({
    isTemplate: true,
    level: level
  })
    .sort({ usageCount: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to search configurations
chartConfigurationSchema.statics.searchConfigurations = function (userId, searchTerm, filters = {}) {
  const query = {
    createdBy: userId,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };

  // Apply additional filters
  if (filters.level) query.level = filters.level;
  if (filters.chartType) query.chartType = filters.chartType;
  if (filters.isTemplate !== undefined) query.isTemplate = filters.isTemplate;

  return this.find(query)
    .sort({ updatedAt: -1 })
    .lean();
};

// Pre-save middleware to validate chart configuration
chartConfigurationSchema.pre('save', function (next) {
  // Validate that chart type is compatible with axis configurations
  if (this.chartType === 'PIE') {
    if (this.yAxis.type !== 'number') {
      return next(new Error('Pie charts require numeric Y-axis values'));
    }
  }

  // Ensure template configurations have proper category
  if (this.isTemplate && !this.templateCategory) {
    this.templateCategory = this.level.toLowerCase();
  }

  next();
});

// Post-save middleware to update usage statistics
chartConfigurationSchema.post('save', function (doc) {
  // Update template usage statistics if this is derived from a template
  // This can be implemented based on specific requirements
});

const ChartConfiguration = mongoose.model('ChartConfiguration', chartConfigurationSchema);

module.exports = ChartConfiguration;
