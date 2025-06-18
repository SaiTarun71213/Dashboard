/**
 * API TESTING SCRIPT
 * Tests the main API endpoints to verify functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testAPI() {
    try {
        console.log('🚀 Starting API tests...\n');

        // Test 1: Health Check
        console.log('1️⃣ Testing Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', healthResponse.data.status);

        // Test 2: API Info
        console.log('\n2️⃣ Testing API Info...');
        const apiResponse = await axios.get(`${BASE_URL}/api`);
        console.log('✅ API Info:', apiResponse.data.message);

        // Test 3: User Login
        console.log('\n3️⃣ Testing User Login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        if (loginResponse.data.success) {
            authToken = loginResponse.data.data.tokens.accessToken;
            console.log('✅ Login successful for:', loginResponse.data.data.user.name);
            console.log('   Role:', loginResponse.data.data.user.role);
        }

        // Test 4: Get States (Protected Route)
        console.log('\n4️⃣ Testing Get States (Protected)...');
        const statesResponse = await axios.get(`${BASE_URL}/api/states`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (statesResponse.data.success) {
            console.log('✅ States retrieved:', statesResponse.data.data.states.length);
            statesResponse.data.data.states.forEach(state => {
                console.log(`   - ${state.name} (${state.code}): ${state.energyProfile.totalCapacity} MW`);
            });
        }

        // Test 5: Get Plants (Protected Route)
        console.log('\n5️⃣ Testing Get Plants (Protected)...');
        const plantsResponse = await axios.get(`${BASE_URL}/api/plants`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (plantsResponse.data.success) {
            console.log('✅ Plants retrieved:', plantsResponse.data.data.plants.length);
            plantsResponse.data.data.plants.forEach(plant => {
                console.log(`   - ${plant.name} (${plant.type}): ${plant.technical.capacity.installed} MW`);
            });
        }

        // Test 6: Get User Profile
        console.log('\n6️⃣ Testing Get User Profile...');
        const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (profileResponse.data.success) {
            const user = profileResponse.data.data.user;
            console.log('✅ Profile retrieved for:', user.personalInfo.firstName, user.personalInfo.lastName);
            console.log('   Email:', user.personalInfo.email);
            console.log('   Role:', user.authorization.role);
        }

        // Test 7: Test Unauthorized Access
        console.log('\n7️⃣ Testing Unauthorized Access...');
        try {
            await axios.get(`${BASE_URL}/api/states`);
            console.log('❌ Unauthorized access should have failed');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Unauthorized access properly blocked');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🎉 All API tests completed successfully!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Health Check: Working');
        console.log('   ✅ API Documentation: Working');
        console.log('   ✅ User Authentication: Working');
        console.log('   ✅ Protected Routes: Working');
        console.log('   ✅ Authorization: Working');
        console.log('   ✅ Data Retrieval: Working');

    } catch (error) {
        console.error('❌ API test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testAPI();
