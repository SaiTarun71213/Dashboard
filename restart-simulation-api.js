/**
 * RESTART SIMULATION VIA API
 * Restarts the simulation to pick up code changes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function restartSimulationViaAPI() {
    try {
        console.log('🔄 Restarting simulation via API...\n');

        // Login
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Restart simulation
        console.log('\n🔄 Restarting simulation...');
        const restartResponse = await axios.post(`${BASE_URL}/api/simulation/restart`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (restartResponse.data.success) {
            console.log('✅ Simulation restarted successfully!');
            console.log(`📊 Equipment: ${restartResponse.data.data.equipmentCount} units`);
            console.log(`⏱️ Running: ${restartResponse.data.data.isRunning ? 'Yes' : 'No'}`);
            
            // Check status after a moment
            setTimeout(async () => {
                try {
                    const statusResponse = await axios.get(`${BASE_URL}/api/simulation/status`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (statusResponse.data.success) {
                        const status = statusResponse.data.data;
                        console.log('\n📊 Current Status:');
                        console.log(`   Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
                        console.log(`   Equipment: ${status.equipmentCount} units`);
                        console.log(`   Readings: ${status.readingCount}`);
                        console.log(`   Uptime: ${status.uptimeFormatted || '0s'}`);
                        
                        if (status.equipmentCount > 0) {
                            console.log('\n🎉 Simulation is working! Data will be generated every minute.');
                            console.log('💡 Wait 65 seconds to see the first readings generated.');
                        }
                    }
                } catch (error) {
                    console.error('❌ Error checking status:', error.message);
                }
            }, 3000);
            
        } else {
            console.log('❌ Failed to restart simulation');
        }

    } catch (error) {
        if (error.response?.status === 400) {
            console.log('⚠️ Simulation issue:', error.response.data.message);
        } else {
            console.error('❌ Error:', error.response?.data || error.message);
        }
    }
}

// Run the script
restartSimulationViaAPI();
