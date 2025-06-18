const { app, setup404Handler } = require('./app');
const databaseConfig = require('./config/database');
const http = require('http');
const { createApolloServer } = require('./graphql/server');
const redisConfig = require('./config/redis');
const aggregationEngine = require('./services/AggregationEngine');
const webSocketService = require('./services/WebSocketService');

// Server configuration
const PORT = process.env.PORT || 3001;

// Start the server
const startServer = async () => {
    try {
        // Connect to database first
        await databaseConfig.connect();

        // Initialize Redis (optional - will work without Redis)
        console.log('🔄 Initializing Redis cache...');
        console.log('⚠️ Redis disabled for demo - aggregation will run without caching');
        // Uncomment the following lines to enable Redis:
        // try {
        //     await redisConfig.connect();
        // } catch (error) {
        //     console.log('⚠️ Redis not available, aggregation will run without caching');
        // }

        // Initialize aggregation engine
        await aggregationEngine.initialize();

        // Create HTTP server
        const httpServer = http.createServer(app);

        // Initialize WebSocket service
        webSocketService.initialize(httpServer);

        // Create Apollo GraphQL server
        const apolloServer = createApolloServer();

        // Start Apollo server
        await apolloServer.start();

        // Apply Apollo GraphQL middleware to Express app
        apolloServer.applyMiddleware({
            app,
            path: '/graphql',
            cors: false // We handle CORS in Express
        });

        // Add 404 handler after GraphQL setup
        setup404Handler(app);

        // Start the HTTP server
        const server = httpServer.listen(PORT, () => {
            console.log('🚀 Server started successfully!');
            console.log(`🌐 Server running on: http://localhost:${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
            console.log('\n📋 Available endpoints:');
            console.log(`   GET  http://localhost:${PORT}/health`);
            console.log(`   GET  http://localhost:${PORT}/api`);
            console.log(`   POST http://localhost:${PORT}${apolloServer.graphqlPath}`);
            console.log(`   WS   ws://localhost:${PORT} (Socket.IO)`);
        });

        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            } else {
                console.error('❌ Server error:', error.message);
            }
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    try {
        // Stop WebSocket service
        webSocketService.stop();

        // Close Redis connection
        await redisConfig.disconnect();

        // Close database connection (this will call process.exit)
        await databaseConfig.gracefulShutdown(signal);

    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the application
startServer();
