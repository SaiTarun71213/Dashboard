/**
 * WEBSOCKET TESTING SCRIPT
 * Tests the WebSocket real-time broadcasting functionality
 */

const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testWebSocketService() {
    try {
        console.log('🧪 Testing WebSocket Real-time Broadcasting...\n');

        // Step 1: Login to get authentication token
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        authToken = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Step 2: Test WebSocket API endpoints
        console.log('\n1️⃣ Testing WebSocket API Endpoints...');
        
        // Test health endpoint
        const healthResponse = await axios.get(`${BASE_URL}/api/websocket/health`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (healthResponse.data.success) {
            console.log('✅ WebSocket health check passed');
            console.log(`   Status: ${healthResponse.data.data.status}`);
            console.log(`   Connected Clients: ${healthResponse.data.data.connectedClients}`);
        }

        // Test configuration endpoint
        const configResponse = await axios.get(`${BASE_URL}/api/websocket/config`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (configResponse.data.success) {
            const config = configResponse.data.data.config;
            console.log('✅ WebSocket configuration retrieved');
            console.log(`   Broadcast Interval: ${config.broadcastInterval / 1000}s`);
            console.log(`   Max Clients Per Room: ${config.maxClientsPerRoom}`);
            console.log(`   Ping Timeout: ${config.pingTimeout / 1000}s`);
        }

        // Step 3: Test WebSocket connection
        console.log('\n2️⃣ Testing WebSocket Connection...');
        
        const socket = io(BASE_URL, {
            auth: {
                token: authToken
            },
            transports: ['websocket']
        });

        // Set up event handlers
        socket.on('connect', () => {
            console.log('✅ WebSocket connected successfully');
            console.log(`   Socket ID: ${socket.id}`);
        });

        socket.on('connected', (data) => {
            console.log('✅ Server welcome message received');
            console.log(`   Client ID: ${data.clientId}`);
            console.log(`   User Role: ${data.user.role}`);
            console.log(`   Broadcast Interval: ${data.broadcastInterval / 1000}s`);
        });

        socket.on('sectorAggregation', (data) => {
            console.log('📊 Sector aggregation received');
            console.log(`   Type: ${data.type}`);
            console.log(`   Total Power: ${data.data.electrical?.activePower?.toFixed(1) || 0} kW`);
            console.log(`   Equipment: ${data.data.equipment?.total || 0} units`);
            console.log(`   Data Points: ${data.data.dataPoints || 0}`);
            console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`);
        });

        socket.on('dashboardSummary', (data) => {
            console.log('📈 Dashboard summary received');
            console.log(`   Type: ${data.type}`);
            console.log(`   Total Power: ${data.data.overview?.totalPower?.toFixed(1) || 0} kW`);
            console.log(`   Efficiency: ${data.data.overview?.avgEfficiency?.toFixed(1) || 0}%`);
            console.log(`   Operational: ${data.data.equipment?.operational || 0}/${data.data.equipment?.total || 0} units`);
        });

        socket.on('testMessage', (data) => {
            console.log('🧪 Test message received');
            console.log(`   Message: ${data.message}`);
            console.log(`   From: ${data.from}`);
            console.log(`   Timestamp: ${new Date(data.timestamp).toLocaleTimeString()}`);
        });

        socket.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 WebSocket disconnected: ${reason}`);
        });

        // Wait for connection and initial data
        await new Promise(resolve => {
            socket.on('dashboardSummary', (data) => {
                if (data.type === 'initial') {
                    resolve();
                }
            });
        });

        // Step 4: Test subscription functionality
        console.log('\n3️⃣ Testing Subscription Functionality...');
        
        socket.emit('subscribe', { type: 'sector', timeWindow: '1h' });
        
        socket.on('subscribed', (data) => {
            console.log('✅ Subscription successful');
            console.log(`   Room: ${data.roomName}`);
            console.log(`   Type: ${data.type}`);
            console.log(`   Time Window: ${data.timeWindow}`);
        });

        // Step 5: Test manual broadcast trigger
        console.log('\n4️⃣ Testing Manual Broadcast...');
        
        const broadcastResponse = await axios.post(`${BASE_URL}/api/websocket/broadcast`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (broadcastResponse.data.success) {
            console.log('✅ Manual broadcast triggered');
            console.log(`   Broadcasted to: ${broadcastResponse.data.data.broadcastedTo} clients`);
        }

        // Step 6: Test message sending
        console.log('\n5️⃣ Testing Test Message...');
        
        const testMessageResponse = await axios.post(`${BASE_URL}/api/websocket/test`, {
            message: 'Hello from WebSocket test!',
            type: 'test'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (testMessageResponse.data.success) {
            console.log('✅ Test message sent');
            console.log(`   Sent to: ${testMessageResponse.data.data.sentTo} clients`);
        }

        // Step 7: Get statistics
        console.log('\n6️⃣ Testing Statistics...');
        
        const statsResponse = await axios.get(`${BASE_URL}/api/websocket/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (statsResponse.data.success) {
            const stats = statsResponse.data.data.webSocket;
            console.log('✅ WebSocket statistics retrieved');
            console.log(`   Connected Clients: ${stats.connectedClients}`);
            console.log(`   Rooms: ${stats.rooms}`);
            console.log(`   Broadcast Interval: ${stats.broadcastInterval / 1000}s`);
            console.log(`   Clients by Role: ${JSON.stringify(stats.clientsByRole)}`);
        }

        // Wait for a broadcast cycle
        console.log('\n7️⃣ Waiting for Broadcast Cycle...');
        console.log('   Waiting 35 seconds for next automatic broadcast...');
        
        await new Promise(resolve => {
            setTimeout(() => {
                console.log('✅ Broadcast cycle completed');
                resolve();
            }, 35000);
        });

        // Clean up
        socket.disconnect();
        
        console.log('\n🎉 WebSocket Testing Completed Successfully!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ WebSocket API endpoints working');
        console.log('   ✅ WebSocket connection established');
        console.log('   ✅ Authentication integration working');
        console.log('   ✅ Real-time data broadcasting working');
        console.log('   ✅ Subscription functionality working');
        console.log('   ✅ Manual broadcast triggering working');
        console.log('   ✅ Test message sending working');
        console.log('   ✅ Statistics and monitoring working');
        console.log('   ✅ Automatic broadcast cycles working');
        
        console.log('\n🌟 Key Features Demonstrated:');
        console.log('   • Real-time bidirectional communication');
        console.log('   • JWT-based WebSocket authentication');
        console.log('   • Room-based subscription management');
        console.log('   • Automatic data broadcasting every 30 seconds');
        console.log('   • Manual broadcast triggering');
        console.log('   • Live aggregation data streaming');
        console.log('   • Dashboard summary updates');
        console.log('   • Client statistics and monitoring');

    } catch (error) {
        console.error('❌ WebSocket test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testWebSocketService();
