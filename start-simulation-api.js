/**
 * START SIMULATION VIA API
 * Starts the simulation using the REST API endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function startSimulationViaAPI() {
    try {
        console.log('🚀 Starting simulation via API...\n');

        // Login
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Start simulation
        console.log('\n🎯 Starting simulation...');
        const startResponse = await axios.post(`${BASE_URL}/api/simulation/start`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (startResponse.data.success) {
            console.log('✅ Simulation started successfully!');
            console.log(`📊 Equipment: ${startResponse.data.data.equipmentCount} units`);
            console.log(`⏱️ Interval: Every minute`);
            
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
                    }
                } catch (error) {
                    console.error('❌ Error checking status:', error.message);
                }
            }, 3000);
            
            console.log('\n💡 Simulation is now running in the background');
            console.log('   Check status: npm run simulate:status');
            console.log('   Stop simulation: npm run simulate:stop');
            console.log('   Or use the API endpoints directly');
            
        } else {
            console.log('❌ Failed to start simulation');
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
startSimulationViaAPI();
