const mongoose = require('mongoose');

/**
 * DASHBOARD MODEL
 * Stores dashboard configurations with chart layouts
 * Supports drag-and-drop positioning and responsive grid layouts
 */

const dashboardItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    description: 'Unique widget identifier within the dashboard'
  },
  type: {
    type: String,
    required: true,
    enum: ['chart', 'metric', 'table', 'text', 'image', 'iframe', 'custom'],
    default: 'chart',
    description: 'Widget type'
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    description: 'Widget title'
  },
  chartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartConfiguration',
    description: 'Chart configuration ID for chart widgets'
  },
  position: {
    x: {
      type: Number,
      required: true,
      min: 0
    },
    y: {
      type: Number,
      required: true,
      min: 0
    }
  },
  size: {
    width: {
      type: Number,
      required: true,
      min: 1,
      max: 12 // Grid system with 12 columns
    },
    height: {
      type: Number,
      required: true,
      min: 1,
      max: 20 // Maximum height in grid units
    }
  },
  // Widget configuration
  config: {
    // Metric widget specific
    metric: {
      field: String,
      label: String,
      unit: String,
      format: String,
      aggregation: {
        type: String,
        enum: ['SUM', 'AVERAGE', 'MAX', 'MIN', 'COUNT', 'LATEST']
      },
      threshold: {
        warning: Number,
        critical: Number
      }
    },

    // Table widget specific
    table: {
      columns: [{
        field: String,
        label: String,
        type: {
          type: String,
          enum: ['string', 'number', 'datetime', 'boolean']
        },
        format: String,
        sortable: { type: Boolean, default: true },
        filterable: { type: Boolean, default: true }
      }],
      pageSize: { type: Number, default: 10, min: 5, max: 100 },
      sortBy: String,
      sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' }
    },

    // Text widget specific
    text: {
      content: String,
      format: {
        type: String,
        enum: ['plain', 'markdown', 'html'],
        default: 'plain'
      },
      fontSize: { type: String, default: '14px' },
      textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      backgroundColor: String,
      textColor: String
    },

    // Custom configuration
    custom: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Custom configuration object'
    }
  },

  // Widget options
  options: {
    title: {
      type: String,
      trim: true
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      min: 30, // Minimum 30 seconds
      max: 3600, // Maximum 1 hour
      default: 300 // Default 5 minutes
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    customStyles: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    resizable: { type: Boolean, default: true },
    draggable: { type: Boolean, default: true },
    removable: { type: Boolean, default: true },
    collapsible: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false }
  }
}, { _id: true });

const dashboardSchema = new mongoose.Schema({
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
  dashboardType: {
    type: String,
    enum: ['LIVE', 'ANALYTICAL'],
    default: 'ANALYTICAL',
    index: true
  },
  items: [dashboardItemSchema],
  layout: {
    columns: {
      type: Number,
      default: 12,
      min: 1,
      max: 24
    },
    rowHeight: {
      type: Number,
      default: 100, // Height in pixels
      min: 50,
      max: 300
    },
    margin: {
      x: { type: Number, default: 10, min: 0, max: 50 },
      y: { type: Number, default: 10, min: 0, max: 50 }
    },
    responsive: {
      type: Boolean,
      default: true
    },
    breakpoints: {
      lg: { type: Number, default: 1200 },
      md: { type: Number, default: 996 },
      sm: { type: Number, default: 768 },
      xs: { type: Number, default: 480 }
    }
  },
  filters: {
    global: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timeRange: {
      start: Date,
      end: Date,
      preset: {
        type: String,
        enum: ['LAST_HOUR', 'LAST_DAY', 'LAST_WEEK', 'LAST_MONTH', 'CUSTOM']
      }
    }
  },
  settings: {
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 300, // 5 minutes
      min: 30,
      max: 3600
    },
    theme: {
      type: String,
      enum: ['LIGHT', 'DARK', 'AUTO'],
      default: 'LIGHT'
    },
    showGrid: {
      type: Boolean,
      default: false
    },
    allowEdit: {
      type: Boolean,
      default: true
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
      enum: ['VIEW', 'EDIT', 'ADMIN'],
      default: 'VIEW'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  usageStats: {
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViewed: Date,
    avgSessionDuration: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
dashboardSchema.index({ createdBy: 1, level: 1 });
dashboardSchema.index({ createdBy: 1, dashboardType: 1 });
dashboardSchema.index({ isTemplate: 1, level: 1 });
dashboardSchema.index({ tags: 1 });
dashboardSchema.index({ 'usageStats.viewCount': -1 });
dashboardSchema.index({ 'favorites': 1 });

// Virtual for dashboard summary
dashboardSchema.virtual('summary').get(function () {
  return {
    id: this._id,
    name: this.name,
    level: this.level,
    dashboardType: this.dashboardType,
    chartCount: this.items.length,
    isTemplate: this.isTemplate,
    viewCount: this.usageStats.viewCount,
    lastViewed: this.usageStats.lastViewed,
    isFavorite: false // Will be set by resolver based on current user
  };
});

// Virtual for chart count
dashboardSchema.virtual('chartCount').get(function () {
  return this.items.length;
});

// Method to add chart to dashboard
dashboardSchema.methods.addChart = function (chartId, position, size, options = {}) {
  // Check for overlapping positions
  const hasOverlap = this.items.some(item => {
    return this.checkOverlap(item.position, item.size, position, size);
  });

  if (hasOverlap) {
    throw new Error('Chart position overlaps with existing chart');
  }

  const newItem = {
    chartId,
    position,
    size,
    options
  };

  this.items.push(newItem);
  return this.save();
};

// Method to update chart position/size
dashboardSchema.methods.updateChartLayout = function (itemId, position, size) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Chart item not found');
  }

  // Check for overlapping positions (excluding current item)
  const hasOverlap = this.items.some(otherItem => {
    return otherItem._id.toString() !== itemId.toString() &&
      this.checkOverlap(otherItem.position, otherItem.size, position, size);
  });

  if (hasOverlap) {
    throw new Error('New position overlaps with existing chart');
  }

  item.position = position;
  item.size = size;

  return this.save();
};

// Method to remove chart from dashboard
dashboardSchema.methods.removeChart = function (itemId) {
  this.items.pull({ _id: itemId });
  return this.save();
};

// Method to check position overlap
dashboardSchema.methods.checkOverlap = function (pos1, size1, pos2, size2) {
  return !(pos1.x + size1.width <= pos2.x ||
    pos2.x + size2.width <= pos1.x ||
    pos1.y + size1.height <= pos2.y ||
    pos2.y + size2.height <= pos1.y);
};

// Method to optimize layout (auto-arrange charts)
dashboardSchema.methods.optimizeLayout = function () {
  // Sort items by size (larger items first)
  this.items.sort((a, b) => (b.size.width * b.size.height) - (a.size.width * a.size.height));

  // Reset positions and arrange in grid
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  this.items.forEach(item => {
    // Check if item fits in current row
    if (currentX + item.size.width > this.layout.columns) {
      // Move to next row
      currentX = 0;
      currentY += rowHeight;
      rowHeight = 0;
    }

    item.position.x = currentX;
    item.position.y = currentY;

    currentX += item.size.width;
    rowHeight = Math.max(rowHeight, item.size.height);
  });

  return this.save();
};

// Method to create template from dashboard
dashboardSchema.methods.createTemplate = function (templateName, category) {
  const templateData = this.toObject();
  delete templateData._id;
  delete templateData.createdAt;
  delete templateData.updatedAt;

  templateData.name = templateName || `${this.name} Template`;
  templateData.isTemplate = true;
  templateData.templateCategory = category;
  templateData.usageStats = {
    viewCount: 0,
    avgSessionDuration: 0
  };

  return new this.constructor(templateData);
};

// Method to increment view count
dashboardSchema.methods.incrementViewCount = function (sessionDuration = 0) {
  this.usageStats.viewCount += 1;
  this.usageStats.lastViewed = new Date();

  if (sessionDuration > 0) {
    const totalDuration = (this.usageStats.avgSessionDuration * (this.usageStats.viewCount - 1)) + sessionDuration;
    this.usageStats.avgSessionDuration = totalDuration / this.usageStats.viewCount;
  }

  return this.save();
};

// Static method to get popular dashboards
dashboardSchema.statics.getPopularDashboards = function (level, limit = 10) {
  return this.find({
    level: level,
    'usageStats.viewCount': { $gt: 0 }
  })
    .sort({ 'usageStats.viewCount': -1, updatedAt: -1 })
    .limit(limit)
    .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
    .lean();
};

// Static method to get user favorites
dashboardSchema.statics.getUserFavorites = function (userId) {
  return this.find({
    favorites: userId
  })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'personalInfo.firstName personalInfo.lastName')
    .lean();
};

// Pre-save middleware to validate dashboard layout
dashboardSchema.pre('save', function (next) {
  // Validate that all chart positions are within grid bounds
  const invalidItems = this.items.filter(item => {
    return item.position.x + item.size.width > this.layout.columns ||
      item.position.x < 0 || item.position.y < 0;
  });

  if (invalidItems.length > 0) {
    return next(new Error('Some chart positions are outside grid bounds'));
  }

  // Set template category if template
  if (this.isTemplate && !this.templateCategory) {
    this.templateCategory = this.level.toLowerCase();
  }

  next();
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;
