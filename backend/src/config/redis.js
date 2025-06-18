const redis = require('redis');

/**
 * REDIS CONFIGURATION
 * Handles Redis connection and client management for caching and real-time data
 */

class RedisConfig {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
    }

    /**
     * Connect to Redis server
     */
    async connect() {
        try {
            console.log('🔄 Connecting to Redis...');

            // Redis connection configuration
            const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                enableReadyCheck: true,
                maxRetriesPerRequest: 1,
                lazyConnect: true,
                connectTimeout: 5000,
                retryDelayOnClusterDown: 300,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 1
            };

            // Create Redis client
            this.client = redis.createClient(redisConfig);

            // Set up event handlers
            this.setupEventHandlers();

            // Connect to Redis
            await this.client.connect();

            this.isConnected = true;
            this.connectionAttempts = 0;

            console.log('✅ Redis connected successfully');
            console.log(`📍 Redis server: ${redisConfig.host}:${redisConfig.port}`);
            console.log(`🗄️ Database: ${redisConfig.db}`);

            // Test the connection
            await this.testConnection();

        } catch (error) {
            console.error('❌ Redis connection failed:', error.message);
            this.isConnected = false;

            // Don't retry automatically to avoid blocking server startup
            this.connectionAttempts++;
            if (this.connectionAttempts >= this.maxRetries) {
                console.log('⚠️ Redis not available. Aggregation engine will run without caching.');
                console.log('💡 To enable Redis caching, install and start Redis server.');
            }
        }
    }

    /**
     * Set up Redis event handlers
     */
    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('🔗 Redis client connected');
        });

        this.client.on('ready', () => {
            console.log('✅ Redis client ready');
            this.isConnected = true;
        });

        this.client.on('error', (error) => {
            console.error('❌ Redis error:', error.message);
            this.isConnected = false;
        });

        this.client.on('end', () => {
            console.log('🔌 Redis connection ended');
            this.isConnected = false;
        });

        this.client.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });
    }

    /**
     * Test Redis connection
     */
    async testConnection() {
        try {
            const testKey = 'energy_dashboard_test';
            const testValue = 'connection_test';

            await this.client.set(testKey, testValue, { EX: 10 }); // Expire in 10 seconds
            const result = await this.client.get(testKey);

            if (result === testValue) {
                console.log('✅ Redis connection test passed');
                await this.client.del(testKey); // Clean up
            } else {
                throw new Error('Redis test value mismatch');
            }
        } catch (error) {
            console.error('❌ Redis connection test failed:', error.message);
            throw error;
        }
    }

    /**
     * Get Redis client
     */
    getClient() {
        if (!this.isConnected || !this.client) {
            console.warn('⚠️ Redis client not available, operations will be skipped');
            return null;
        }
        return this.client;
    }

    /**
     * Check if Redis is connected
     */
    isRedisConnected() {
        return this.isConnected && this.client && this.client.isReady;
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                console.log('✅ Redis disconnected successfully');
            }
        } catch (error) {
            console.error('❌ Error disconnecting Redis:', error.message);
        } finally {
            this.isConnected = false;
            this.client = null;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            ready: this.client ? this.client.isReady : false,
            connectionAttempts: this.connectionAttempts,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Flush all Redis data (use with caution)
     */
    async flushAll() {
        try {
            if (this.isRedisConnected()) {
                await this.client.flushAll();
                console.log('🗑️ Redis cache cleared');
            }
        } catch (error) {
            console.error('❌ Error flushing Redis:', error.message);
        }
    }

    /**
     * Get Redis info
     */
    async getInfo() {
        try {
            if (this.isRedisConnected()) {
                const info = await this.client.info();
                return this.parseRedisInfo(info);
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting Redis info:', error.message);
            return null;
        }
    }

    /**
     * Parse Redis info string into object
     */
    parseRedisInfo(infoString) {
        const info = {};
        const lines = infoString.split('\r\n');

        lines.forEach(line => {
            if (line && !line.startsWith('#') && line.includes(':')) {
                const [key, value] = line.split(':');
                info[key] = value;
            }
        });

        return {
            version: info.redis_version,
            mode: info.redis_mode,
            uptime: parseInt(info.uptime_in_seconds),
            connectedClients: parseInt(info.connected_clients),
            usedMemory: info.used_memory_human,
            totalSystemMemory: info.total_system_memory_human,
            keyspaceHits: parseInt(info.keyspace_hits),
            keyspaceMisses: parseInt(info.keyspace_misses)
        };
    }
}

// Create singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;
