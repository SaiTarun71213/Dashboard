/**
 * CHECK SIMULATION STATISTICS
 * Monitors the live simulation progress via API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkSimulationStats() {
    try {
        console.log('📊 Checking Live Simulation Statistics...\n');

        // Login
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.data.tokens.accessToken;

        // Get simulation status
        console.log('1️⃣ Simulation Status:');
        const statusResponse = await axios.get(`${BASE_URL}/api/simulation/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (statusResponse.data.success) {
            const status = statusResponse.data.data;
            console.log(`   Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
            console.log(`   Equipment: ${status.equipmentCount} units`);
            console.log(`   Readings: ${status.readingCount.toLocaleString()}`);
            console.log(`   Uptime: ${status.uptimeFormatted || '0s'}`);
            console.log(`   Rate: ${status.readingsPerMinute || 0} readings/minute`);
        }

        // Get detailed statistics
        console.log('\n2️⃣ Database Statistics:');
        const statsResponse = await axios.get(`${BASE_URL}/api/simulation/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (statsResponse.data.success) {
            const stats = statsResponse.data.data;
            console.log(`   Total Readings: ${stats.database.totalReadings.toLocaleString()}`);
            console.log(`   Last 24 Hours: ${stats.database.last24HoursReadings.toLocaleString()}`);
            console.log(`   Last Hour: ${stats.database.lastHourReadings.toLocaleString()}`);
            console.log(`   Simulated Data: ${stats.database.simulatedPercentage}%`);
            console.log(`   Equipment Count: ${stats.database.equipmentCount}`);
            
            console.log('\n   Performance:');
            console.log(`   Expected Rate: ${stats.performance.expectedRate} readings/hour`);
            console.log(`   Current Rate: ${stats.performance.currentHourlyRate} readings/hour`);
            console.log(`   Average Rate: ${stats.performance.avgReadingsPerHour} readings/hour`);
        }

        // Get latest readings
        console.log('\n3️⃣ Latest Readings Sample:');
        const readingsResponse = await axios.get(`${BASE_URL}/api/readings/latest?limit=5`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (readingsResponse.data.success) {
            const readings = readingsResponse.data.data.readings;
            console.log(`   Found ${readings.length} recent readings:`);
            
            readings.forEach((reading, index) => {
                const timestamp = new Date(reading.timestamp).toLocaleTimeString();
                const power = reading.electrical?.activePower || 0;
                const efficiency = reading.performance?.efficiency || 0;
                console.log(`   ${index + 1}. ${timestamp} - ${power.toFixed(1)}kW, ${efficiency.toFixed(1)}% efficiency`);
            });
        }

        console.log('\n🎉 Simulation monitoring completed!');
        console.log('\n💡 Commands:');
        console.log('   Stop: npm run simulate:stop');
        console.log('   Restart: npm run simulate:restart');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the check
checkSimulationStats();
