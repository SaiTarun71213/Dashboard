const LiveDataSimulator = require('../services/LiveDataSimulator');

/**
 * SIMULATION CONTROLLER
 * REST API endpoints for controlling live data simulation
 * Provides web interface for simulation management
 */

// Global simulator instance
let simulator = null;

class SimulationController {
    /**
     * Get simulation status
     * GET /api/simulation/status
     */
    async getStatus(req, res) {
        try {
            if (!simulator) {
                return res.json({
                    success: true,
                    data: {
                        isRunning: false,
                        equipmentCount: 0,
                        readingCount: 0,
                        uptime: 0,
                        message: 'Simulation not initialized'
                    }
                });
            }

            const status = simulator.getStatus();
            
            res.json({
                success: true,
                data: {
                    ...status,
                    uptimeFormatted: this.formatUptime(status.uptime),
                    readingsPerMinute: status.uptime > 0 ? 
                        Math.round((status.readingCount / (status.uptime / 60)) * 100) / 100 : 0
                }
            });

        } catch (error) {
            console.error('Get simulation status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting simulation status'
            });
        }
    }

    /**
     * Start simulation
     * POST /api/simulation/start
     */
    async startSimulation(req, res) {
        try {
            if (!simulator) {
                simulator = new LiveDataSimulator();
            }

            const status = simulator.getStatus();
            if (status.isRunning) {
                return res.status(400).json({
                    success: false,
                    message: 'Simulation is already running'
                });
            }

            await simulator.start();

            res.json({
                success: true,
                message: 'Live data simulation started successfully',
                data: simulator.getStatus()
            });

        } catch (error) {
            console.error('Start simulation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error starting simulation'
            });
        }
    }

    /**
     * Stop simulation
     * POST /api/simulation/stop
     */
    async stopSimulation(req, res) {
        try {
            if (!simulator) {
                return res.status(400).json({
                    success: false,
                    message: 'No simulation instance found'
                });
            }

            const status = simulator.getStatus();
            if (!status.isRunning) {
                return res.status(400).json({
                    success: false,
                    message: 'Simulation is not running'
                });
            }

            simulator.stop();

            res.json({
                success: true,
                message: 'Live data simulation stopped successfully',
                data: simulator.getStatus()
            });

        } catch (error) {
            console.error('Stop simulation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error stopping simulation'
            });
        }
    }

    /**
     * Restart simulation
     * POST /api/simulation/restart
     */
    async restartSimulation(req, res) {
        try {
            if (simulator) {
                simulator.stop();
                // Wait a moment before restarting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            simulator = new LiveDataSimulator();
            await simulator.start();

            res.json({
                success: true,
                message: 'Live data simulation restarted successfully',
                data: simulator.getStatus()
            });

        } catch (error) {
            console.error('Restart simulation error:', error);
            res.status(500).json({
                success: false,
                message: 'Error restarting simulation'
            });
        }
    }

    /**
     * Get simulation configuration
     * GET /api/simulation/config
     */
    async getConfig(req, res) {
        try {
            if (!simulator) {
                simulator = new LiveDataSimulator();
            }

            const status = simulator.getStatus();
            
            res.json({
                success: true,
                data: {
                    config: status.config,
                    description: {
                        interval: 'Cron expression for data generation frequency',
                        batchSize: 'Number of equipment units processed in each batch',
                        weatherVariation: 'Percentage of weather-based variation in power output',
                        equipmentFailureRate: 'Probability of equipment issues per reading',
                        seasonalFactor: 'Current seasonal adjustment factor'
                    }
                }
            });

        } catch (error) {
            console.error('Get simulation config error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting simulation configuration'
            });
        }
    }

    /**
     * Get simulation statistics
     * GET /api/simulation/stats
     */
    async getStats(req, res) {
        try {
            const { Reading, Equipment } = require('../models');
            
            // Get recent readings count
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const lastHour = new Date(Date.now() - 60 * 60 * 1000);
            
            const [
                totalReadings,
                last24HoursReadings,
                lastHourReadings,
                equipmentCount,
                simulatedReadings
            ] = await Promise.all([
                Reading.countDocuments(),
                Reading.countDocuments({ timestamp: { $gte: last24Hours } }),
                Reading.countDocuments({ timestamp: { $gte: lastHour } }),
                Equipment.countDocuments(),
                Reading.countDocuments({ 'dataQuality.source': 'SCADA_SIM' })
            ]);

            const simulationStatus = simulator ? simulator.getStatus() : { isRunning: false };

            res.json({
                success: true,
                data: {
                    simulation: simulationStatus,
                    database: {
                        totalReadings,
                        last24HoursReadings,
                        lastHourReadings,
                        equipmentCount,
                        simulatedReadings,
                        simulatedPercentage: totalReadings > 0 ? 
                            Math.round((simulatedReadings / totalReadings) * 100) : 0
                    },
                    performance: {
                        avgReadingsPerHour: last24Hours > 0 ? Math.round(last24HoursReadings / 24) : 0,
                        currentHourlyRate: lastHourReadings,
                        expectedRate: equipmentCount // 1 reading per equipment per minute = 60 per hour
                    }
                }
            });

        } catch (error) {
            console.error('Get simulation stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting simulation statistics'
            });
        }
    }

    /**
     * Helper: Format uptime in human-readable format
     */
    formatUptime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
}

const simulationController = new SimulationController();

module.exports = {
    getStatus: simulationController.getStatus.bind(simulationController),
    startSimulation: simulationController.startSimulation.bind(simulationController),
    stopSimulation: simulationController.stopSimulation.bind(simulationController),
    restartSimulation: simulationController.restartSimulation.bind(simulationController),
    getConfig: simulationController.getConfig.bind(simulationController),
    getStats: simulationController.getStats.bind(simulationController)
};
