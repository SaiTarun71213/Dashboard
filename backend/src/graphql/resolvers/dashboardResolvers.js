const { Dashboard, ChartConfiguration } = require('../../models');

/**
 * DASHBOARD RESOLVERS
 * Handles dashboard CRUD operations and layout management
 * Supports drag-and-drop functionality and template system
 */

const dashboardResolvers = {
  Query: {
    /**
     * Get all dashboards for a user
     */
    async getDashboards(parent, { level }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const filter = { createdBy: user._id };
        if (level) {
          filter.level = level;
        }

        const dashboards = await Dashboard.find(filter)
          .sort({ updatedAt: -1 })
          .populate('items.chartId', 'name chartType level')
          .lean();

        return dashboards;

      } catch (error) {
        console.error('Get dashboards error:', error);
        throw new Error('Failed to get dashboards');
      }
    },

    /**
     * Get a specific dashboard
     */
    async getDashboard(parent, { id }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOne({
          _id: id,
          $or: [
            { createdBy: user._id },
            { 'sharedWith.user': user._id }
          ]
        })
        .populate('items.chartId')
        .lean();

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        return dashboard;

      } catch (error) {
        console.error('Get dashboard error:', error);
        throw new Error('Failed to get dashboard');
      }
    },

    /**
     * Get dashboard templates
     */
    async getDashboardTemplates(parent, { level }, context) {
      try {
        const { isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const templates = await Dashboard.find({
          isTemplate: true,
          level: level
        })
        .sort({ 'usageStats.viewCount': -1, createdAt: -1 })
        .populate('items.chartId', 'name chartType')
        .lean();

        return templates;

      } catch (error) {
        console.error('Get dashboard templates error:', error);
        throw new Error('Failed to get dashboard templates');
      }
    }
  },

  Mutation: {
    /**
     * Create a new dashboard
     */
    async createDashboard(parent, { input }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboardData = {
          ...input,
          createdBy: user._id,
          items: []
        };

        const dashboard = new Dashboard(dashboardData);
        await dashboard.save();

        return dashboard.toObject();

      } catch (error) {
        console.error('Create dashboard error:', error);
        throw new Error('Failed to create dashboard');
      }
    },

    /**
     * Update dashboard
     */
    async updateDashboard(parent, { id, input }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOneAndUpdate(
          { _id: id, createdBy: user._id },
          { ...input, updatedAt: new Date() },
          { new: true, runValidators: true }
        );

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        return dashboard.toObject();

      } catch (error) {
        console.error('Update dashboard error:', error);
        throw new Error('Failed to update dashboard');
      }
    },

    /**
     * Delete dashboard
     */
    async deleteDashboard(parent, { id }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const result = await Dashboard.deleteOne({
          _id: id,
          createdBy: user._id
        });

        return result.deletedCount > 0;

      } catch (error) {
        console.error('Delete dashboard error:', error);
        throw new Error('Failed to delete dashboard');
      }
    },

    /**
     * Add chart to dashboard
     */
    async addDashboardItem(parent, { dashboardId, item }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          createdBy: user._id
        });

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        // Verify chart exists and user has access
        const chart = await ChartConfiguration.findOne({
          _id: item.chartId,
          createdBy: user._id
        });

        if (!chart) {
          throw new Error('Chart not found');
        }

        await dashboard.addChart(item.chartId, item.position, item.size, item.options);
        
        return await Dashboard.findById(dashboardId)
          .populate('items.chartId')
          .lean();

      } catch (error) {
        console.error('Add dashboard item error:', error);
        throw new Error('Failed to add chart to dashboard');
      }
    },

    /**
     * Update dashboard item layout
     */
    async updateDashboardItem(parent, { dashboardId, itemId, item }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          createdBy: user._id
        });

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        await dashboard.updateChartLayout(itemId, item.position, item.size);
        
        return await Dashboard.findById(dashboardId)
          .populate('items.chartId')
          .lean();

      } catch (error) {
        console.error('Update dashboard item error:', error);
        throw new Error('Failed to update dashboard item');
      }
    },

    /**
     * Remove chart from dashboard
     */
    async removeDashboardItem(parent, { dashboardId, itemId }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          createdBy: user._id
        });

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        await dashboard.removeChart(itemId);
        
        return await Dashboard.findById(dashboardId)
          .populate('items.chartId')
          .lean();

      } catch (error) {
        console.error('Remove dashboard item error:', error);
        throw new Error('Failed to remove chart from dashboard');
      }
    },

    /**
     * Create dashboard template
     */
    async createDashboardTemplate(parent, { dashboardId }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const dashboard = await Dashboard.findOne({
          _id: dashboardId,
          createdBy: user._id
        });

        if (!dashboard) {
          throw new Error('Dashboard not found');
        }

        const template = dashboard.createTemplate();
        await template.save();

        return template.toObject();

      } catch (error) {
        console.error('Create dashboard template error:', error);
        throw new Error('Failed to create dashboard template');
      }
    },

    /**
     * Apply dashboard template
     */
    async applyDashboardTemplate(parent, { templateId, name }, context) {
      try {
        const { user, isAuthenticated } = context;
        
        if (!isAuthenticated) {
          throw new Error('Authentication required');
        }

        const template = await Dashboard.findOne({
          _id: templateId,
          isTemplate: true
        }).populate('items.chartId');

        if (!template) {
          throw new Error('Template not found');
        }

        // Create new dashboard from template
        const dashboardData = template.toObject();
        delete dashboardData._id;
        delete dashboardData.createdAt;
        delete dashboardData.updatedAt;
        
        dashboardData.name = name;
        dashboardData.isTemplate = false;
        dashboardData.createdBy = user._id;
        dashboardData.usageStats = {
          viewCount: 0,
          avgSessionDuration: 0
        };

        const newDashboard = new Dashboard(dashboardData);
        await newDashboard.save();

        // Increment template usage
        template.usageStats.viewCount += 1;
        await template.save();

        return newDashboard.toObject();

      } catch (error) {
        console.error('Apply dashboard template error:', error);
        throw new Error('Failed to apply dashboard template');
      }
    }
  },

  Subscription: {
    /**
     * Subscribe to dashboard updates
     */
    dashboardUpdates: {
      // This will be implemented with WebSocket/Redis pub-sub
      subscribe: () => {
        // Placeholder for subscription implementation
        throw new Error('Dashboard subscriptions not yet implemented');
      }
    }
  },

  Dashboard: {
    /**
     * Resolve dashboard creator
     */
    async createdBy(parent) {
      try {
        const { User } = require('../../models');
        const user = await User.findById(parent.createdBy)
          .select('personalInfo.firstName personalInfo.lastName personalInfo.email')
          .lean();
        
        return user;
      } catch (error) {
        console.error('Resolve dashboard creator error:', error);
        return null;
      }
    }
  },

  DashboardItem: {
    /**
     * Resolve chart configuration for dashboard item
     */
    async chart(parent) {
      try {
        const chart = await ChartConfiguration.findById(parent.chartId).lean();
        return chart;
      } catch (error) {
        console.error('Resolve dashboard item chart error:', error);
        return null;
      }
    }
  }
};

module.exports = dashboardResolvers;
