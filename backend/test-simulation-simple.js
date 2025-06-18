/**
 * SIMPLE SIMULATION TEST
 * Basic test of simulation functionality without GraphQL
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSimpleSimulation() {
    try {
        console.log('🧪 Testing Basic Simulation API...\n');

        // Test 1: Health check
        console.log('1️⃣ Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is healthy');

        // Test 2: Login
        console.log('\n2️⃣ Testing authentication...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        if (loginResponse.data.success) {
            const token = loginResponse.data.data.tokens.accessToken;
            console.log('✅ Authentication successful');

            // Test 3: Check equipment
            console.log('\n3️⃣ Checking equipment...');
            const equipmentResponse = await axios.get(`${BASE_URL}/api/equipment`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (equipmentResponse.data.success) {
                console.log(`✅ Found ${equipmentResponse.data.data.equipment.length} equipment units`);
            }

            // Test 4: Simulation status
            console.log('\n4️⃣ Testing simulation status...');
            const statusResponse = await axios.get(`${BASE_URL}/api/simulation/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (statusResponse.data.success) {
                console.log('✅ Simulation status API working');
                console.log(`   Running: ${statusResponse.data.data.isRunning}`);
                console.log(`   Equipment: ${statusResponse.data.data.equipmentCount}`);
            }

            console.log('\n🎉 Basic simulation test completed successfully!');
            console.log('\n💡 To start simulation manually:');
            console.log('   npm run simulate:start');

        } else {
            console.log('❌ Authentication failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server is not running. Start it with: npm start');
        }
    }
}

// Run the test
testSimpleSimulation();
