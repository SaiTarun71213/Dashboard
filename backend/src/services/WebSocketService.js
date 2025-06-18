const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const aggregationEngine = require('./AggregationEngine');

/**
 * WEBSOCKET SERVICE
 * Handles real-time communication for live dashboard updates
 * Provides authenticated WebSocket connections with room management
 */

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Map();
        this.rooms = new Map();
        this.broadcastInterval = null;
        this.isInitialized = false;

        // Configuration
        this.config = {
            broadcastInterval: 30000, // 30 seconds
            maxClientsPerRoom: 100,
            pingTimeout: 60000,
            pingInterval: 25000
        };
    }

    /**
     * Initialize WebSocket server
     */
    initialize(httpServer) {
        try {
            console.log('🔄 Initializing WebSocket service...');

            // Create Socket.IO server
            this.io = new Server(httpServer, {
                cors: {
                    origin: process.env.FRONTEND_URL || "http://localhost:3000",
                    methods: ["GET", "POST"],
                    credentials: true
                },
                pingTimeout: this.config.pingTimeout,
                pingInterval: this.config.pingInterval
            });

            // Set up authentication middleware
            this.setupAuthentication();

            // Set up connection handling
            this.setupConnectionHandling();

            // Start broadcasting
            this.startBroadcasting();

            this.isInitialized = true;
            console.log('✅ WebSocket service initialized successfully');
            console.log(`📡 Broadcasting interval: ${this.config.broadcastInterval / 1000}s`);

        } catch (error) {
            console.error('❌ Failed to initialize WebSocket service:', error);
            throw error;
        }
    }

    /**
     * Set up authentication middleware
     */
    setupAuthentication() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get user details
                const user = await User.findById(decoded.userId).lean();

                if (!user) {
                    return next(new Error('User not found'));
                }

                // Attach user to socket
                socket.user = user;
                socket.userId = user._id.toString();
                socket.userRole = user.role;
                socket.accessScope = user.accessScope;

                console.log(`🔗 WebSocket authenticated: ${user.email} (${user.role})`);
                next();

            } catch (error) {
                console.error('❌ WebSocket authentication failed:', error.message);
                next(new Error('Authentication failed'));
            }
        });
    }

    /**
     * Set up connection handling
     */
    setupConnectionHandling() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    /**
     * Handle new client connection
     */
    handleConnection(socket) {
        const clientId = socket.id;
        const userId = socket.userId;
        const userRole = socket.userRole;

        console.log(`📱 Client connected: ${clientId} (User: ${socket.user.email})`);

        // Store client information
        this.connectedClients.set(clientId, {
            socket,
            userId,
            userRole,
            accessScope: socket.accessScope,
            connectedAt: new Date(),
            lastActivity: new Date()
        });

        // Send welcome message with user info
        socket.emit('connected', {
            clientId,
            user: {
                id: userId,
                email: socket.user.email,
                role: userRole,
                accessScope: socket.accessScope
            },
            serverTime: new Date(),
            broadcastInterval: this.config.broadcastInterval
        });

        // Set up event handlers
        this.setupSocketEventHandlers(socket);

        // Join default rooms based on access scope
        this.joinDefaultRooms(socket);

        // Send initial data
        this.sendInitialData(socket);
    }

    /**
     * Set up socket event handlers
     */
    setupSocketEventHandlers(socket) {
        // Handle room subscription
        socket.on('subscribe', (data) => {
            this.handleSubscription(socket, data);
        });

        // Handle room unsubscription
        socket.on('unsubscribe', (data) => {
            this.handleUnsubscription(socket, data);
        });

        // Handle ping for keep-alive
        socket.on('ping', () => {
            const client = this.connectedClients.get(socket.id);
            if (client) {
                client.lastActivity = new Date();
            }
            socket.emit('pong', { serverTime: new Date() });
        });

        // Handle request for specific data
        socket.on('requestData', (data) => {
            this.handleDataRequest(socket, data);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`❌ Socket error for ${socket.id}:`, error);
        });
    }

    /**
     * Join default rooms based on user access scope
     */
    joinDefaultRooms(socket) {
        const accessScope = socket.accessScope;

        // Join sector room (all users)
        socket.join('sector:all');

        // Join state-specific rooms if user has state access
        if (accessScope?.states && accessScope.states.length > 0) {
            accessScope.states.forEach(state => {
                socket.join(`state:${state._id}`);
            });
        }

        // Join plant-specific rooms if user has plant access
        if (accessScope?.plants && accessScope.plants.length > 0) {
            accessScope.plants.forEach(plant => {
                socket.join(`plant:${plant._id}`);
            });
        }

        console.log(`📍 Client ${socket.id} joined default rooms based on access scope`);
    }

    /**
     * Send initial data to newly connected client
     */
    async sendInitialData(socket) {
        try {
            // Send sector-level aggregation
            const sectorAgg = await aggregationEngine.aggregateStatesToSector('1h');
            socket.emit('sectorAggregation', {
                data: sectorAgg,
                timestamp: new Date(),
                type: 'initial'
            });

            // Send dashboard summary
            const dashboardSummary = this.createDashboardSummary(sectorAgg);
            socket.emit('dashboardSummary', {
                data: dashboardSummary,
                timestamp: new Date(),
                type: 'initial'
            });

            console.log(`📊 Initial data sent to client ${socket.id}`);

        } catch (error) {
            console.error(`❌ Error sending initial data to ${socket.id}:`, error);
        }
    }

    /**
     * Handle subscription requests
     */
    handleSubscription(socket, data) {
        const { type, id, timeWindow = '1h' } = data;

        if (!type) {
            socket.emit('error', { message: 'Subscription type required' });
            return;
        }

        const roomName = id ? `${type}:${id}` : `${type}:all`;

        // Check if user has access to this data
        if (!this.checkAccess(socket, type, id)) {
            socket.emit('error', { message: 'Access denied to requested data' });
            return;
        }

        socket.join(roomName);
        socket.emit('subscribed', { type, id, roomName, timeWindow });

        console.log(`📡 Client ${socket.id} subscribed to ${roomName}`);
    }

    /**
     * Handle unsubscription requests
     */
    handleUnsubscription(socket, data) {
        const { type, id } = data;
        const roomName = id ? `${type}:${id}` : `${type}:all`;

        socket.leave(roomName);
        socket.emit('unsubscribed', { type, id, roomName });

        console.log(`📡 Client ${socket.id} unsubscribed from ${roomName}`);
    }

    /**
     * Handle specific data requests
     */
    async handleDataRequest(socket, data) {
        try {
            const { type, id, timeWindow = '1h' } = data;

            if (!this.checkAccess(socket, type, id)) {
                socket.emit('error', { message: 'Access denied to requested data' });
                return;
            }

            let aggregation;

            switch (type) {
                case 'plant':
                    aggregation = await aggregationEngine.aggregateEquipmentToPlant(id, timeWindow);
                    break;
                case 'state':
                    aggregation = await aggregationEngine.aggregatePlantsToState(id, timeWindow);
                    break;
                case 'sector':
                    aggregation = await aggregationEngine.aggregateStatesToSector(timeWindow);
                    break;
                default:
                    socket.emit('error', { message: 'Invalid data type requested' });
                    return;
            }

            socket.emit('dataResponse', {
                type,
                id,
                timeWindow,
                data: aggregation,
                timestamp: new Date()
            });

        } catch (error) {
            console.error(`❌ Error handling data request from ${socket.id}:`, error);
            socket.emit('error', { message: 'Error retrieving requested data' });
        }
    }

    /**
     * Handle client disconnection
     */
    handleDisconnection(socket, reason) {
        const clientId = socket.id;
        const client = this.connectedClients.get(clientId);

        if (client) {
            const duration = Date.now() - client.connectedAt.getTime();
            console.log(`📱 Client disconnected: ${clientId} (${client.userId}) - Duration: ${Math.round(duration / 1000)}s - Reason: ${reason}`);
            this.connectedClients.delete(clientId);
        }
    }

    /**
     * Check if user has access to specific data
     */
    checkAccess(socket, type, id) {
        const accessScope = socket.accessScope;
        const userRole = socket.userRole;

        // Super Admin and Admin have access to everything
        if (['Super Admin', 'Admin'].includes(userRole)) {
            return true;
        }

        // Sector-level data is accessible to all authenticated users
        if (type === 'sector') {
            return true;
        }

        // State-level access check
        if (type === 'state' && accessScope?.states) {
            return accessScope.states.some(state => state._id.toString() === id);
        }

        // Plant-level access check
        if (type === 'plant' && accessScope?.plants) {
            return accessScope.plants.some(plant => plant._id.toString() === id);
        }

        return false;
    }

    /**
     * Start broadcasting real-time data
     */
    startBroadcasting() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
        }

        this.broadcastInterval = setInterval(async () => {
            await this.broadcastRealTimeData();
        }, this.config.broadcastInterval);

        console.log(`📡 Started real-time broadcasting every ${this.config.broadcastInterval / 1000} seconds`);
    }

    /**
     * Broadcast real-time data to all connected clients
     */
    async broadcastRealTimeData() {
        try {
            if (this.connectedClients.size === 0) {
                return; // No clients connected
            }

            // Get sector-level aggregation
            const sectorAgg = await aggregationEngine.aggregateStatesToSector('1h');
            const dashboardSummary = this.createDashboardSummary(sectorAgg);

            // Broadcast to sector room
            this.io.to('sector:all').emit('sectorAggregation', {
                data: sectorAgg,
                timestamp: new Date(),
                type: 'broadcast'
            });

            this.io.to('sector:all').emit('dashboardSummary', {
                data: dashboardSummary,
                timestamp: new Date(),
                type: 'broadcast'
            });

            // Log broadcast
            const clientCount = this.connectedClients.size;
            console.log(`📡 Broadcasted real-time data to ${clientCount} connected clients`);

        } catch (error) {
            console.error('❌ Error broadcasting real-time data:', error);
        }
    }

    /**
     * Create dashboard summary from aggregation data
     */
    createDashboardSummary(sectorAgg) {
        return {
            overview: {
                totalPower: sectorAgg.electrical?.activePower || 0,
                totalEnergy: sectorAgg.electrical?.totalEnergy || 0,
                avgEfficiency: sectorAgg.performance?.avgEfficiency || 0,
                avgAvailability: sectorAgg.performance?.avgAvailability || 0
            },
            equipment: {
                total: sectorAgg.equipment?.total || 0,
                operational: sectorAgg.equipment?.operational || 0,
                maintenance: sectorAgg.equipment?.maintenance || 0,
                fault: sectorAgg.equipment?.fault || 0,
                operationalPercentage: sectorAgg.equipment?.total > 0 ?
                    Math.round((sectorAgg.equipment.operational / sectorAgg.equipment.total) * 100) : 0
            },
            infrastructure: {
                states: sectorAgg.states?.total || 0,
                plants: sectorAgg.plants?.total || 0,
                plantsByType: sectorAgg.plants?.byType || {}
            },
            environmental: {
                avgTemperature: sectorAgg.environmental?.avgTemperature || 0,
                avgHumidity: sectorAgg.environmental?.avgHumidity || 0,
                maxSolarIrradiance: sectorAgg.environmental?.maxSolarIrradiance || 0,
                maxWindSpeed: sectorAgg.environmental?.maxWindSpeed || 0
            },
            dataQuality: {
                dataPoints: sectorAgg.dataPoints || 0,
                lastUpdated: sectorAgg.lastUpdated,
                timeWindow: '1h'
            }
        };
    }

    /**
     * Get service statistics
     */
    getStats() {
        const clients = Array.from(this.connectedClients.values());

        return {
            isInitialized: this.isInitialized,
            connectedClients: this.connectedClients.size,
            broadcastInterval: this.config.broadcastInterval,
            clientsByRole: clients.reduce((acc, client) => {
                acc[client.userRole] = (acc[client.userRole] || 0) + 1;
                return acc;
            }, {}),
            rooms: this.io ? this.io.sockets.adapter.rooms.size : 0,
            uptime: this.isInitialized ? Date.now() - this.initTime : 0
        };
    }

    /**
     * Stop broadcasting and close connections
     */
    stop() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
        }

        if (this.io) {
            this.io.close();
            console.log('🛑 WebSocket service stopped');
        }

        this.connectedClients.clear();
        this.isInitialized = false;
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
