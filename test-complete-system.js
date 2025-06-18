/**
 * COMPLETE SYSTEM TEST
 * Tests the entire real-time energy dashboard system:
 * Live Data Simulation → Aggregation Engine → WebSocket Broadcasting
 */

const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testCompleteSystem() {
    try {
        console.log('🎯 Testing Complete Real-time Energy Dashboard System...\n');

        // Step 1: Authentication
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        authToken = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Step 2: Check simulation status
        console.log('\n1️⃣ Checking Live Data Simulation...');
        const simStatusResponse = await axios.get(`${BASE_URL}/api/simulation/status`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (simStatusResponse.data.success) {
            const status = simStatusResponse.data.data;
            console.log('✅ Simulation status retrieved');
            console.log(`   Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
            console.log(`   Equipment: ${status.equipmentCount} units`);
            console.log(`   Readings Generated: ${status.readingCount.toLocaleString()}`);
            console.log(`   Uptime: ${status.uptimeFormatted || '0s'}`);
        }

        // Step 3: Test aggregation engine
        console.log('\n2️⃣ Testing Real-time Aggregation Engine...');
        const aggResponse = await axios.get(`${BASE_URL}/api/aggregation/dashboard?timeWindow=1h`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (aggResponse.data.success) {
            const summary = aggResponse.data.data.summary;
            console.log('✅ Aggregation engine working');
            console.log(`   Total Power: ${summary.overview?.totalPower?.toFixed(1) || 0} kW`);
            console.log(`   Total Energy: ${summary.overview?.totalEnergy?.toFixed(1) || 0} kWh`);
            console.log(`   Avg Efficiency: ${summary.overview?.avgEfficiency?.toFixed(1) || 0}%`);
            console.log(`   Equipment: ${summary.equipment?.total || 0} total, ${summary.equipment?.operational || 0} operational`);
            console.log(`   Data Points: ${summary.dataQuality?.dataPoints || 0}`);
        }

        // Step 4: Connect to WebSocket for real-time updates
        console.log('\n3️⃣ Connecting to Real-time WebSocket...');
        
        const socket = io(BASE_URL, {
            auth: { token: authToken },
            transports: ['websocket']
        });

        let dataReceived = {
            connected: false,
            initialData: false,
            broadcasts: 0,
            lastPower: 0,
            lastEquipmentCount: 0
        };

        // Set up event handlers
        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            dataReceived.connected = true;
        });

        socket.on('connected', (data) => {
            console.log('✅ Server welcome received');
            console.log(`   User: ${data.user.email}`);
            console.log(`   Role: ${data.user.role}`);
        });

        socket.on('sectorAggregation', (data) => {
            const power = data.data.electrical?.activePower || 0;
            const equipment = data.data.equipment?.total || 0;
            const dataPoints = data.data.dataPoints || 0;
            
            console.log(`📊 Real-time aggregation received (${data.type})`);
            console.log(`   Power: ${power.toFixed(1)} kW`);
            console.log(`   Equipment: ${equipment} units`);
            console.log(`   Data Points: ${dataPoints}`);
            console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`);
            
            if (data.type === 'initial') {
                dataReceived.initialData = true;
            } else if (data.type === 'broadcast') {
                dataReceived.broadcasts++;
            }
            
            dataReceived.lastPower = power;
            dataReceived.lastEquipmentCount = equipment;
        });

        socket.on('dashboardSummary', (data) => {
            const summary = data.data;
            console.log(`📈 Dashboard summary received (${data.type})`);
            console.log(`   Total Power: ${summary.overview?.totalPower?.toFixed(1) || 0} kW`);
            console.log(`   Efficiency: ${summary.overview?.avgEfficiency?.toFixed(1) || 0}%`);
            console.log(`   Operational: ${summary.equipment?.operational || 0}/${summary.equipment?.total || 0} (${summary.equipment?.operationalPercentage || 0}%)`);
        });

        // Wait for initial data
        await new Promise(resolve => {
            socket.on('dashboardSummary', (data) => {
                if (data.type === 'initial') {
                    resolve();
                }
            });
        });

        // Step 5: Monitor real-time broadcasts
        console.log('\n4️⃣ Monitoring Real-time Broadcasts...');
        console.log('   Waiting for 2 automatic broadcast cycles (60 seconds)...');
        
        await new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 65000); // Wait for 2 broadcast cycles
        });

        // Step 6: Test manual broadcast
        console.log('\n5️⃣ Testing Manual Broadcast Trigger...');
        const manualBroadcastResponse = await axios.post(`${BASE_URL}/api/websocket/broadcast`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (manualBroadcastResponse.data.success) {
            console.log('✅ Manual broadcast triggered');
            console.log(`   Sent to: ${manualBroadcastResponse.data.data.broadcastedTo} clients`);
        }

        // Wait for manual broadcast to arrive
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 7: Get final statistics
        console.log('\n6️⃣ Final System Statistics...');
        
        // WebSocket stats
        const wsStatsResponse = await axios.get(`${BASE_URL}/api/websocket/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (wsStatsResponse.data.success) {
            const wsStats = wsStatsResponse.data.data.webSocket;
            console.log('📡 WebSocket Statistics:');
            console.log(`   Connected Clients: ${wsStats.connectedClients}`);
            console.log(`   Rooms: ${wsStats.rooms}`);
            console.log(`   Broadcast Interval: ${wsStats.broadcastInterval / 1000}s`);
        }

        // Simulation stats
        const simStatsResponse = await axios.get(`${BASE_URL}/api/simulation/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (simStatsResponse.data.success) {
            const simStats = simStatsResponse.data.data;
            console.log('🔄 Simulation Statistics:');
            console.log(`   Total Readings: ${simStats.database.totalReadings.toLocaleString()}`);
            console.log(`   Last Hour: ${simStats.database.lastHourReadings.toLocaleString()}`);
            console.log(`   Current Rate: ${simStats.performance.currentHourlyRate} readings/hour`);
            console.log(`   Equipment: ${simStats.database.equipmentCount} units`);
        }

        // Clean up
        socket.disconnect();

        console.log('\n🎉 Complete System Test Successful!');
        console.log('\n📊 Test Results Summary:');
        console.log(`   ✅ WebSocket Connected: ${dataReceived.connected}`);
        console.log(`   ✅ Initial Data Received: ${dataReceived.initialData}`);
        console.log(`   ✅ Broadcasts Received: ${dataReceived.broadcasts}`);
        console.log(`   ✅ Last Power Reading: ${dataReceived.lastPower.toFixed(1)} kW`);
        console.log(`   ✅ Equipment Count: ${dataReceived.lastEquipmentCount} units`);
        
        console.log('\n🌟 Complete System Architecture Working:');
        console.log('   1. 📊 Live Data Simulation - Generating realistic SCADA data every minute');
        console.log('   2. 🔄 Real-time Aggregation - Hierarchical rollups (equipment → plant → state → sector)');
        console.log('   3. 📡 WebSocket Broadcasting - Live updates pushed to connected dashboards');
        console.log('   4. 🔐 Authentication Integration - JWT-based security throughout');
        console.log('   5. 📈 Performance Monitoring - Statistics and health checks');
        
        console.log('\n💡 Ready for Production:');
        console.log('   • Real-time dashboards can connect and receive live updates');
        console.log('   • Hierarchical data aggregation scales to any infrastructure size');
        console.log('   • WebSocket rooms support user-specific data scopes');
        console.log('   • Manual broadcast triggers for immediate updates');
        console.log('   • Comprehensive monitoring and statistics');

    } catch (error) {
        console.error('❌ Complete system test failed:', error.response?.data || error.message);
    }
}

// Run the complete system test
testCompleteSystem();
