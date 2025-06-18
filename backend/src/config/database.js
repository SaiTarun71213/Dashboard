const mongoose = require('mongoose');

/**
 * DATABASE CONFIGURATION
 * Handles MongoDB connection with optimized settings for energy monitoring data
 */

class DatabaseConfig {
    constructor() {
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard';
        this.options = {
            // Connection Pool Settings
            maxPoolSize: 10,
            minPoolSize: 5,

            // Timeout Settings
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000
        };
    }

    /**
     * Connect to MongoDB with retry logic
     */
    async connect() {
        try {
            console.log('🔄 Connecting to MongoDB...');
            console.log(`📍 Connection String: ${this.connectionString.replace(/\/\/.*@/, '//***:***@')}`);

            // Connect to MongoDB
            await mongoose.connect(this.connectionString, this.options);

            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            console.log(`📈 Ready State: ${mongoose.connection.readyState}`);

            // Set up connection event listeners
            this.setupEventListeners();

            // Optimize for time-series data
            await this.optimizeForTimeSeries();

            return mongoose.connection;

        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);

            // Retry connection in development
            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 Retrying connection in 5 seconds...');
                setTimeout(() => this.connect(), 5000);
            } else {
                process.exit(1);
            }
        }
    }

    /**
     * Set up connection event listeners
     */
    setupEventListeners() {
        const connection = mongoose.connection;

        // Connection events
        connection.on('connected', () => {
            console.log('📡 Mongoose connected to MongoDB');
        });

        connection.on('error', (error) => {
            console.error('❌ Mongoose connection error:', error);
        });

        connection.on('disconnected', () => {
            console.log('📡 Mongoose disconnected from MongoDB');
        });

        // Reconnection events
        connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconnected to MongoDB');
        });

        connection.on('reconnectFailed', () => {
            console.error('❌ Mongoose reconnection failed');
        });

        // Process events for graceful shutdown
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // Nodemon restart
    }

    /**
     * Optimize database for time-series data
     */
    async optimizeForTimeSeries() {
        try {
            const db = mongoose.connection.db;

            // Create time-series collection for readings if it doesn't exist
            const collections = await db.listCollections({ name: 'readings' }).toArray();

            if (collections.length === 0) {
                console.log('📊 Creating optimized time-series collection for readings...');

                await db.createCollection('readings', {
                    timeseries: {
                        timeField: 'timestamp',
                        metaField: 'equipment',
                        granularity: 'minutes'
                    },
                    expireAfterSeconds: 63072000 // 2 years retention
                });

                console.log('✅ Time-series collection created successfully');
            }

            // Create additional indexes for performance
            await this.createPerformanceIndexes();

        } catch (error) {
            console.warn('⚠️ Time-series optimization warning:', error.message);
        }
    }

    /**
     * Create performance indexes
     */
    async createPerformanceIndexes() {
        try {
            const db = mongoose.connection.db;

            // Compound indexes for common query patterns
            const indexOperations = [
                // State-based queries
                { collection: 'plants', index: { 'location.state': 1, status: 1 } },
                { collection: 'equipment', index: { plant: 1, type: 1, 'performance.currentStatus': 1 } },

                // Time-based queries
                { collection: 'readings', index: { equipment: 1, timestamp: -1 } },
                { collection: 'readings', index: { plant: 1, timestamp: -1 } },

                // Performance queries
                { collection: 'plants', index: { 'technical.capacity.installed': -1 } },
                { collection: 'equipment', index: { 'performance.availability': -1 } },

                // Geospatial queries
                { collection: 'plants', index: { 'location.coordinates': '2dsphere' } },
                { collection: 'states', index: { 'geography.coordinates': '2dsphere' } }
            ];

            for (const { collection, index } of indexOperations) {
                try {
                    await db.collection(collection).createIndex(index, { background: true });
                    console.log(`📈 Created index on ${collection}:`, Object.keys(index).join(', '));
                } catch (indexError) {
                    console.warn(`⚠️ Index creation warning for ${collection}:`, indexError.message);
                }
            }

        } catch (error) {
            console.warn('⚠️ Performance index creation warning:', error.message);
        }
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown(signal) {
        console.log(`\n🔄 Received ${signal}, closing MongoDB connection gracefully...`);

        try {
            await mongoose.connection.close();
            console.log('📊 MongoDB connection closed successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during MongoDB shutdown:', error.message);
            process.exit(1);
        }
    }

    /**
     * Get connection statistics
     */
    getConnectionStats() {
        const connection = mongoose.connection;

        return {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name,
            collections: Object.keys(connection.collections),
            models: Object.keys(connection.models)
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.ping();

            return {
                status: 'healthy',
                ping: result,
                connection: this.getConnectionStats(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
module.exports = new DatabaseConfig();
