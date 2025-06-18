/**
 * MODELS INDEX
 * Central export point for all database models
 * Provides easy access to all models throughout the application
 */

// Import all models
const State = require('./State');
const Plant = require('./Plant');
const Equipment = require('./Equipment');
const Reading = require('./Reading');
const User = require('./User');
const ChartConfiguration = require('./ChartConfiguration');
const Dashboard = require('./Dashboard');

// Export all models
module.exports = {
    State,
    Plant,
    Equipment,
    Reading,
    User,
    ChartConfiguration,
    Dashboard
};

/**
 * MODEL RELATIONSHIPS OVERVIEW:
 * 
 * 1. State (1) -> Plants (Many)
 *    - One state can have multiple plants
 *    - Plant.location.state references State._id
 * 
 * 2. Plant (1) -> Equipment (Many)
 *    - One plant can have multiple equipment units
 *    - Equipment.plant references Plant._id
 * 
 * 3. Equipment (1) -> Readings (Many)
 *    - One equipment generates multiple readings over time
 *    - Reading.equipment references Equipment._id
 *    - Reading.plant references Plant._id (for faster queries)
 * 
 * 4. User -> Multiple Resources
 *    - Users can be associated with multiple states/plants
 *    - User.authorization.accessScope defines access boundaries
 *    - Audit fields (createdBy, updatedBy) reference User._id
 * 
 * QUERY PATTERNS:
 * 
 * 1. Hierarchical Queries:
 *    State -> Plants -> Equipment -> Readings
 * 
 * 2. Time-Series Queries:
 *    Equipment -> Readings (filtered by timestamp)
 * 
 * 3. Aggregation Queries:
 *    - State-level aggregations across all plants
 *    - Plant-level aggregations across all equipment
 *    - Time-based aggregations (hourly, daily, monthly)
 * 
 * 4. Real-time Queries:
 *    - Latest readings for equipment
 *    - Current status of plants/equipment
 *    - Active alarms and alerts
 */
