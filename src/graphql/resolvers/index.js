const { GraphQLDateTime, GraphQLJSON } = require('graphql-scalars');
const chartResolvers = require('./chartResolvers');
const dashboardResolvers = require('./dashboardResolvers');
const dataResolvers = require('./dataResolvers');
const parameterResolvers = require('./parameterResolvers');
const liveDataResolvers = require('./liveDataResolvers');

/**
 * GRAPHQL RESOLVERS INDEX
 * Combines all resolver modules into a single resolver object
 * Provides centralized resolver management for the GraphQL schema
 */

const resolvers = {
  // Custom scalar types
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,

  // Root resolvers
  Query: {
    // Parameter Discovery
    ...parameterResolvers.Query,

    // Chart Configuration
    ...chartResolvers.Query,

    // Dashboard Management
    ...dashboardResolvers.Query,

    // Chart Data
    ...dataResolvers.Query,

    // Live Data
    ...liveDataResolvers.Query,
  },

  Mutation: {
    // Chart Configuration
    ...chartResolvers.Mutation,

    // Dashboard Management
    ...dashboardResolvers.Mutation,
  },

  Subscription: {
    // Live Data Subscriptions
    ...liveDataResolvers.Subscription,

    // Chart Data Subscriptions
    ...dataResolvers.Subscription,

    // Dashboard Subscriptions
    ...dashboardResolvers.Subscription,
  },

  // Type resolvers for nested fields - will be added as needed
  // ChartConfiguration: {
  //   ...chartResolvers.ChartConfiguration,
  // },

  // Dashboard: {
  //   ...dashboardResolvers.Dashboard,
  // },

  // DashboardItem: {
  //   ...dashboardResolvers.DashboardItem,
  // },

  // ChartData: {
  //   ...dataResolvers.ChartData,
  // },

  // Type resolvers will be added as needed
  // LiveReading: {
  //   ...liveDataResolvers.LiveReading,
  // },

  // PlantSummary: {
  //   ...liveDataResolvers.PlantSummary,
  // },

  // StateSummary: {
  //   ...liveDataResolvers.StateSummary,
  // },
};

module.exports = resolvers;
