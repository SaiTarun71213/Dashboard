/**
 * SIMULATION CONTROL SCRIPT
 * Command-line interface for managing live data simulation
 * Usage: node src/scripts/simulationControl.js [start|stop|status|restart]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LiveDataSimulator = require('../services/LiveDataSimulator');

// Global simulator instance
let simulator = null;

/**
 * Connect to database
 */
async function connectDatabase() {
    try {
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard';
        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Start simulation
 */
async function startSimulation() {
    try {
        if (!simulator) {
            simulator = new LiveDataSimulator();
        }
        
        await simulator.start();
        
        console.log('\n🎯 Simulation Commands:');
        console.log('   node src/scripts/simulationControl.js stop     - Stop simulation');
        console.log('   node src/scripts/simulationControl.js status   - Check status');
        console.log('   node src/scripts/simulationControl.js restart  - Restart simulation');
        
    } catch (error) {
        console.error('❌ Failed to start simulation:', error.message);
        process.exit(1);
    }
}

/**
 * Stop simulation
 */
async function stopSimulation() {
    try {
        if (!simulator) {
            console.log('⚠️ No simulation instance found');
            return;
        }
        
        simulator.stop();
        console.log('✅ Simulation stopped successfully');
        
    } catch (error) {
        console.error('❌ Failed to stop simulation:', error.message);
    }
}

/**
 * Get simulation status
 */
async function getStatus() {
    try {
        if (!simulator) {
            console.log('📊 Simulation Status: Not initialized');
            return;
        }
        
        const status = simulator.getStatus();
        
        console.log('\n📊 Live Data Simulation Status:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔄 Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`⚡ Equipment: ${status.equipmentCount} units`);
        console.log(`📈 Readings Generated: ${status.readingCount.toLocaleString()}`);
        
        if (status.isRunning) {
            const uptimeMinutes = Math.floor(status.uptime / 60);
            const uptimeSeconds = status.uptime % 60;
            console.log(`⏱️ Uptime: ${uptimeMinutes}m ${uptimeSeconds}s`);
            console.log(`📊 Rate: ${(status.readingCount / Math.max(status.uptime / 60, 1)).toFixed(1)} readings/minute`);
            console.log(`🕐 Last Reading: ${new Date(status.lastReading).toLocaleTimeString()}`);
        }
        
        console.log('\n⚙️ Configuration:');
        console.log(`   Interval: ${status.config.interval}`);
        console.log(`   Batch Size: ${status.config.batchSize}`);
        console.log(`   Weather Variation: ${(status.config.weatherVariation * 100).toFixed(0)}%`);
        console.log(`   Failure Rate: ${(status.config.equipmentFailureRate * 100).toFixed(2)}%`);
        console.log(`   Seasonal Factor: ${status.config.seasonalFactor.toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ Failed to get status:', error.message);
    }
}

/**
 * Restart simulation
 */
async function restartSimulation() {
    try {
        console.log('🔄 Restarting simulation...');
        
        if (simulator) {
            simulator.stop();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
        
        simulator = new LiveDataSimulator();
        await simulator.start();
        
        console.log('✅ Simulation restarted successfully');
        
    } catch (error) {
        console.error('❌ Failed to restart simulation:', error.message);
    }
}

/**
 * Display help information
 */
function showHelp() {
    console.log('\n🎯 Live Data Simulation Control');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Available Commands:');
    console.log('   start    - Start the live data simulation');
    console.log('   stop     - Stop the live data simulation');
    console.log('   status   - Show simulation status and statistics');
    console.log('   restart  - Restart the simulation');
    console.log('   help     - Show this help message');
    
    console.log('\n💡 Examples:');
    console.log('   node src/scripts/simulationControl.js start');
    console.log('   node src/scripts/simulationControl.js status');
    console.log('   node src/scripts/simulationControl.js stop');
    
    console.log('\n📊 What the simulation does:');
    console.log('   • Generates realistic SCADA data every minute');
    console.log('   • Simulates solar, wind, and hydro power patterns');
    console.log('   • Includes day/night cycles and weather variations');
    console.log('   • Simulates equipment failures and maintenance');
    console.log('   • Provides data for live dashboards and analytics');
    
    console.log('\n⚠️ Note: Make sure the database is seeded with equipment data first');
    console.log('   Run: npm run seed');
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        
        if (simulator && simulator.getStatus().isRunning) {
            simulator.stop();
        }
        
        try {
            await mongoose.connection.close();
            console.log('✅ Database connection closed');
        } catch (error) {
            console.error('❌ Error closing database:', error.message);
        }
        
        process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main execution function
 */
async function main() {
    const command = process.argv[2];
    
    if (!command || command === 'help') {
        showHelp();
        return;
    }
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Connect to database for all commands except help
    await connectDatabase();
    
    // Initialize simulator for status checks
    if (!simulator && ['status', 'stop'].includes(command)) {
        simulator = new LiveDataSimulator();
    }
    
    // Execute command
    switch (command.toLowerCase()) {
        case 'start':
            await startSimulation();
            // Keep process alive for continuous simulation
            if (simulator && simulator.getStatus().isRunning) {
                console.log('\n💡 Simulation is running. Press Ctrl+C to stop.');
                // Keep the process alive
                setInterval(() => {
                    // Check if simulation is still running
                    if (!simulator.getStatus().isRunning) {
                        console.log('⚠️ Simulation stopped unexpectedly');
                        process.exit(1);
                    }
                }, 30000); // Check every 30 seconds
            }
            break;
            
        case 'stop':
            await stopSimulation();
            await mongoose.connection.close();
            process.exit(0);
            break;
            
        case 'status':
            await getStatus();
            await mongoose.connection.close();
            process.exit(0);
            break;
            
        case 'restart':
            await restartSimulation();
            // Keep process alive for continuous simulation
            if (simulator && simulator.getStatus().isRunning) {
                console.log('\n💡 Simulation is running. Press Ctrl+C to stop.');
                setInterval(() => {
                    if (!simulator.getStatus().isRunning) {
                        console.log('⚠️ Simulation stopped unexpectedly');
                        process.exit(1);
                    }
                }, 30000);
            }
            break;
            
        default:
            console.log(`❌ Unknown command: ${command}`);
            showHelp();
            await mongoose.connection.close();
            process.exit(1);
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
