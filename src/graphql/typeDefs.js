const { gql } = require('apollo-server-express');

/**
 * GRAPHQL TYPE DEFINITIONS
 * Defines the GraphQL schema for energy dashboard data queries
 * Optimized for flexible chart data retrieval and real-time updates
 */

const typeDefs = gql`
  # Scalar types for better type safety
  scalar DateTime
  scalar JSON

  # Enums for better validation
  enum ChartType {
    BAR
    LINE
    COLUMN
    AREA
    PIE
    SCATTER
    BUBBLE
  }

  enum ChartLevel {
    SECTOR
    STATE
    PLANT
    EQUIPMENT
  }

  enum TimeRange {
    HOURLY
    DAILY
    WEEKLY
    MONTHLY
  }

  enum AggregationType {
    SUM
    AVERAGE
    MAX
    MIN
    COUNT
  }

  # Chart Configuration Types
  type ChartParameter {
    field: String!
    label: String!
    type: String!
    unit: String
    aggregationType: AggregationType
  }

  type ChartConfiguration {
    id: ID!
    name: String!
    level: ChartLevel!
    chartType: ChartType!
    xAxis: ChartParameter!
    yAxis: ChartParameter!
    filters: JSON
    timeRange: TimeRange
    createdBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Dashboard Types
  type DashboardItem {
    id: ID!
    chartId: ID!
    chart: ChartConfiguration!
    position: JSON!
    size: JSON!
  }

  type Dashboard {
    id: ID!
    name: String!
    description: String
    level: ChartLevel!
    items: [DashboardItem!]!
    isTemplate: Boolean!
    createdBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Data Types for Chart Rendering
  type ChartDataPoint {
    x: String!
    y: Float!
    label: String
    color: String
    metadata: JSON
  }

  type ChartData {
    series: [ChartSeries!]!
    categories: [String!]
    metadata: JSON
    lastUpdated: DateTime!
  }

  type ChartSeries {
    name: String!
    data: [ChartDataPoint!]!
    type: String
    color: String
  }

  # Real-time Data Types
  type LiveReading {
    id: ID!
    equipment: ID!
    plant: ID!
    timestamp: DateTime!
    activePower: Float
    efficiency: Float
    availability: Float
    status: String
  }

  type PlantSummary {
    id: ID!
    name: String!
    type: String!
    totalPower: Float!
    avgEfficiency: Float!
    avgAvailability: Float!
    equipmentCount: Int!
    operationalCount: Int!
    lastUpdated: DateTime!
  }

  type StateSummary {
    id: ID!
    name: String!
    totalPower: Float!
    totalCapacity: Float!
    avgEfficiency: Float!
    plantCount: Int!
    operationalPlants: Int!
    lastUpdated: DateTime!
  }

  # Parameter Discovery Types
  type FieldInfo {
    field: String!
    label: String!
    type: String!
    unit: String
    aggregationType: AggregationType!
    isNumeric: Boolean!
    isRequired: Boolean!
  }

  type LevelParameters {
    level: ChartLevel!
    fields: [FieldInfo!]!
    filterFields: [FieldInfo!]!
  }

  # Input Types
  input ChartConfigurationInput {
    name: String!
    level: ChartLevel!
    chartType: ChartType!
    xAxis: ChartParameterInput!
    yAxis: ChartParameterInput!
    filters: JSON
    timeRange: TimeRange
  }

  input ChartParameterInput {
    field: String!
    label: String!
    type: String!
    unit: String
    aggregationType: AggregationType
  }

  input DashboardInput {
    name: String!
    description: String
    level: ChartLevel!
    isTemplate: Boolean
  }

  input DashboardItemInput {
    chartId: ID!
    position: JSON!
    size: JSON!
  }

  input ChartDataFilters {
    level: ChartLevel!
    entityIds: [ID!]
    startDate: DateTime
    endDate: DateTime
    timeRange: TimeRange
    customFilters: JSON
  }

  # Queries
  type Query {
    # Parameter Discovery
    getLevelParameters(level: ChartLevel!): LevelParameters!
    getAvailableEntities(level: ChartLevel!, parentId: ID): [JSON!]!
    
    # Chart Configuration
    getChartConfigurations(level: ChartLevel): [ChartConfiguration!]!
    getChartConfiguration(id: ID!): ChartConfiguration
    
    # Dashboard Management
    getDashboards(level: ChartLevel): [Dashboard!]!
    getDashboard(id: ID!): Dashboard
    getDashboardTemplates(level: ChartLevel!): [Dashboard!]!
    
    # Chart Data
    getChartData(
      configurationId: ID!
      filters: ChartDataFilters!
    ): ChartData!
    
    # Live Data
    getLiveReadings(
      equipmentIds: [ID!]
      plantIds: [ID!]
      limit: Int = 10
    ): [LiveReading!]!
    
    getPlantSummaries(
      stateIds: [ID!]
      plantTypes: [String!]
    ): [PlantSummary!]!
    
    getStateSummaries: [StateSummary!]!
    
    # Analytics
    getEnergyTrends(
      level: ChartLevel!
      entityIds: [ID!]!
      timeRange: TimeRange!
      startDate: DateTime
      endDate: DateTime
    ): ChartData!
    
    getPerformanceComparison(
      level: ChartLevel!
      entityIds: [ID!]!
      metric: String!
      timeRange: TimeRange!
    ): ChartData!
  }

  # Mutations
  type Mutation {
    # Chart Configuration
    createChartConfiguration(input: ChartConfigurationInput!): ChartConfiguration!
    updateChartConfiguration(id: ID!, input: ChartConfigurationInput!): ChartConfiguration!
    deleteChartConfiguration(id: ID!): Boolean!
    
    # Dashboard Management
    createDashboard(input: DashboardInput!): Dashboard!
    updateDashboard(id: ID!, input: DashboardInput!): Dashboard!
    deleteDashboard(id: ID!): Boolean!
    
    addDashboardItem(dashboardId: ID!, item: DashboardItemInput!): Dashboard!
    updateDashboardItem(dashboardId: ID!, itemId: ID!, item: DashboardItemInput!): Dashboard!
    removeDashboardItem(dashboardId: ID!, itemId: ID!): Dashboard!
    
    # Dashboard Templates
    createDashboardTemplate(dashboardId: ID!): Dashboard!
    applyDashboardTemplate(templateId: ID!, name: String!): Dashboard!
  }

  # Subscriptions for Real-time Updates
  type Subscription {
    # Live data subscriptions
    liveReadingUpdates(equipmentIds: [ID!]): LiveReading!
    plantSummaryUpdates(plantIds: [ID!]): PlantSummary!
    stateSummaryUpdates: StateSummary!
    
    # Chart data subscriptions
    chartDataUpdates(configurationId: ID!, filters: ChartDataFilters!): ChartData!
    
    # Dashboard subscriptions
    dashboardUpdates(dashboardId: ID!): Dashboard!
  }
`;

module.exports = typeDefs;
