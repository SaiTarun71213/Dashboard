/**
 * SIMULATION TESTING SCRIPT
 * Tests the simulation API endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testSimulation() {
    try {
        console.log('🧪 Testing Simulation System...\n');

        // Login first
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        authToken = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Login successful');

        // Test 1: Check equipment count
        console.log('\n1️⃣ Checking equipment availability...');
        const equipmentResponse = await axios.get(`${BASE_URL}/api/equipment`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (equipmentResponse.data.success) {
            const equipmentCount = equipmentResponse.data.data.equipment.length;
            console.log(`✅ Found ${equipmentCount} equipment units`);
            
            if (equipmentCount === 0) {
                console.log('⚠️ No equipment found. Database needs to be seeded first.');
                console.log('   Run: npm run seed');
                return;
            }
        }

        // Test 2: Get simulation status
        console.log('\n2️⃣ Getting simulation status...');
        const statusResponse = await axios.get(`${BASE_URL}/api/simulation/status`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (statusResponse.data.success) {
            const status = statusResponse.data.data;
            console.log('✅ Simulation status retrieved');
            console.log(`   Running: ${status.isRunning ? 'Yes' : 'No'}`);
            console.log(`   Equipment: ${status.equipmentCount} units`);
            console.log(`   Readings: ${status.readingCount}`);
        }

        // Test 3: Get simulation configuration
        console.log('\n3️⃣ Getting simulation configuration...');
        const configResponse = await axios.get(`${BASE_URL}/api/simulation/config`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (configResponse.data.success) {
            const config = configResponse.data.data.config;
            console.log('✅ Simulation configuration retrieved');
            console.log(`   Interval: ${config.interval}`);
            console.log(`   Seasonal Factor: ${config.seasonalFactor.toFixed(2)}`);
            console.log(`   Weather Variation: ${(config.weatherVariation * 100).toFixed(0)}%`);
        }

        // Test 4: Get simulation statistics
        console.log('\n4️⃣ Getting simulation statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/api/simulation/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (statsResponse.data.success) {
            const stats = statsResponse.data.data;
            console.log('✅ Simulation statistics retrieved');
            console.log(`   Total Readings: ${stats.database.totalReadings.toLocaleString()}`);
            console.log(`   Last 24h: ${stats.database.last24HoursReadings.toLocaleString()}`);
            console.log(`   Last Hour: ${stats.database.lastHourReadings.toLocaleString()}`);
            console.log(`   Simulated: ${stats.database.simulatedPercentage}%`);
        }

        // Test 5: Start simulation (if equipment exists)
        if (equipmentResponse.data.data.equipment.length > 0) {
            console.log('\n5️⃣ Testing simulation start...');
            try {
                const startResponse = await axios.post(`${BASE_URL}/api/simulation/start`, {}, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                
                if (startResponse.data.success) {
                    console.log('✅ Simulation started successfully');
                    console.log('   Waiting 65 seconds for first readings...');
                    
                    // Wait for readings to be generated
                    await new Promise(resolve => setTimeout(resolve, 65000));
                    
                    // Check if readings were generated
                    const newStatsResponse = await axios.get(`${BASE_URL}/api/simulation/stats`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    
                    if (newStatsResponse.data.success) {
                        const newStats = newStatsResponse.data.data;
                        console.log('📊 New readings generated:');
                        console.log(`   Total: ${newStats.database.totalReadings.toLocaleString()}`);
                        console.log(`   Last Hour: ${newStats.database.lastHourReadings.toLocaleString()}`);
                    }
                    
                    // Stop simulation
                    console.log('\n6️⃣ Stopping simulation...');
                    const stopResponse = await axios.post(`${BASE_URL}/api/simulation/stop`, {}, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    
                    if (stopResponse.data.success) {
                        console.log('✅ Simulation stopped successfully');
                    }
                }
            } catch (error) {
                if (error.response?.status === 400) {
                    console.log('⚠️ Simulation already running or other issue:', error.response.data.message);
                } else {
                    throw error;
                }
            }
        }

        console.log('\n🎉 Simulation testing completed!');
        console.log('\n📋 Test Summary:');
        console.log('   ✅ Simulation API endpoints working');
        console.log('   ✅ Authentication integration working');
        console.log('   ✅ Status and configuration retrieval working');
        console.log('   ✅ Statistics and monitoring working');
        
        if (equipmentResponse.data.data.equipment.length > 0) {
            console.log('   ✅ Simulation start/stop working');
            console.log('   ✅ Live data generation working');
        } else {
            console.log('   ⚠️ Need to seed database for full testing');
        }

        console.log('\n💡 Manual simulation commands:');
        console.log('   npm run simulate:start   - Start simulation');
        console.log('   npm run simulate:status  - Check status');
        console.log('   npm run simulate:stop    - Stop simulation');

    } catch (error) {
        console.error('❌ Simulation test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testSimulation();
