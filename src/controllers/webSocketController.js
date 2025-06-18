const webSocketService = require('../services/WebSocketService');

/**
 * WEBSOCKET CONTROLLER
 * Provides REST API endpoints for WebSocket service management
 * Handles WebSocket statistics, client management, and broadcasting control
 */

class WebSocketController {
    /**
     * Get WebSocket service statistics
     * GET /api/websocket/stats
     */
    async getStats(req, res) {
        try {
            const stats = webSocketService.getStats();
            
            res.json({
                success: true,
                data: {
                    webSocket: stats,
                    metadata: {
                        generatedAt: new Date(),
                        service: 'WebSocket Real-time Broadcasting'
                    }
                }
            });

        } catch (error) {
            console.error('Get WebSocket stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting WebSocket statistics'
            });
        }
    }

    /**
     * Get connected clients information
     * GET /api/websocket/clients
     */
    async getClients(req, res) {
        try {
            const stats = webSocketService.getStats();
            
            // Get client details (without sensitive information)
            const clientSummary = {
                totalClients: stats.connectedClients,
                clientsByRole: stats.clientsByRole,
                rooms: stats.rooms,
                broadcastInterval: stats.broadcastInterval,
                uptime: stats.uptime
            };

            res.json({
                success: true,
                data: {
                    clients: clientSummary,
                    metadata: {
                        generatedAt: new Date(),
                        note: 'Detailed client information is not exposed for security reasons'
                    }
                }
            });

        } catch (error) {
            console.error('Get WebSocket clients error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting WebSocket client information'
            });
        }
    }

    /**
     * Trigger manual broadcast
     * POST /api/websocket/broadcast
     */
    async triggerBroadcast(req, res) {
        try {
            if (!webSocketService.isInitialized) {
                return res.status(400).json({
                    success: false,
                    message: 'WebSocket service is not initialized'
                });
            }

            // Trigger manual broadcast
            await webSocketService.broadcastRealTimeData();

            const stats = webSocketService.getStats();

            res.json({
                success: true,
                message: 'Manual broadcast triggered successfully',
                data: {
                    broadcastedTo: stats.connectedClients,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('Trigger broadcast error:', error);
            res.status(500).json({
                success: false,
                message: 'Error triggering manual broadcast'
            });
        }
    }

    /**
     * Get WebSocket service health
     * GET /api/websocket/health
     */
    async getHealth(req, res) {
        try {
            const stats = webSocketService.getStats();
            const isHealthy = stats.isInitialized;

            res.status(isHealthy ? 200 : 503).json({
                success: isHealthy,
                data: {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    initialized: stats.isInitialized,
                    connectedClients: stats.connectedClients,
                    uptime: stats.uptime,
                    lastCheck: new Date()
                }
            });

        } catch (error) {
            console.error('Get WebSocket health error:', error);
            res.status(503).json({
                success: false,
                message: 'WebSocket service health check failed'
            });
        }
    }

    /**
     * Get WebSocket configuration
     * GET /api/websocket/config
     */
    async getConfig(req, res) {
        try {
            const config = {
                broadcastInterval: webSocketService.config?.broadcastInterval || 30000,
                maxClientsPerRoom: webSocketService.config?.maxClientsPerRoom || 100,
                pingTimeout: webSocketService.config?.pingTimeout || 60000,
                pingInterval: webSocketService.config?.pingInterval || 25000,
                corsOrigin: process.env.FRONTEND_URL || "http://localhost:3000"
            };

            res.json({
                success: true,
                data: {
                    config,
                    metadata: {
                        generatedAt: new Date(),
                        description: 'WebSocket service configuration parameters'
                    }
                }
            });

        } catch (error) {
            console.error('Get WebSocket config error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting WebSocket configuration'
            });
        }
    }

    /**
     * Send test message to all connected clients
     * POST /api/websocket/test
     */
    async sendTestMessage(req, res) {
        try {
            const { message = 'Test message from server', type = 'test' } = req.body;

            if (!webSocketService.isInitialized || !webSocketService.io) {
                return res.status(400).json({
                    success: false,
                    message: 'WebSocket service is not available'
                });
            }

            // Send test message to all connected clients
            webSocketService.io.emit('testMessage', {
                message,
                type,
                timestamp: new Date(),
                from: 'server'
            });

            const stats = webSocketService.getStats();

            res.json({
                success: true,
                message: 'Test message sent successfully',
                data: {
                    sentTo: stats.connectedClients,
                    message,
                    type,
                    timestamp: new Date()
                }
            });

        } catch (error) {
            console.error('Send test message error:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending test message'
            });
        }
    }
}

const webSocketController = new WebSocketController();

module.exports = {
    getStats: webSocketController.getStats.bind(webSocketController),
    getClients: webSocketController.getClients.bind(webSocketController),
    triggerBroadcast: webSocketController.triggerBroadcast.bind(webSocketController),
    getHealth: webSocketController.getHealth.bind(webSocketController),
    getConfig: webSocketController.getConfig.bind(webSocketController),
    sendTestMessage: webSocketController.sendTestMessage.bind(webSocketController)
};
