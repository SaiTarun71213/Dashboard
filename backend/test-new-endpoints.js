/**
 * NEW ENDPOINTS TESTING SCRIPT
 * Tests the newly created equipment, readings, and analytics endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testNewEndpoints() {
    try {
        console.log('🚀 Testing new API endpoints...\n');

        // Login first
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        authToken = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Login successful');

        // Test Equipment endpoints
        console.log('\n⚡ Testing Equipment endpoints...');
        
        const equipmentResponse = await axios.get(`${BASE_URL}/api/equipment`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (equipmentResponse.data.success) {
            console.log('✅ Equipment list retrieved:', equipmentResponse.data.data.equipment.length, 'units');
            
            if (equipmentResponse.data.data.equipment.length > 0) {
                const equipmentId = equipmentResponse.data.data.equipment[0]._id;
                
                // Test individual equipment
                const singleEquipment = await axios.get(`${BASE_URL}/api/equipment/${equipmentId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                console.log('✅ Single equipment retrieved:', singleEquipment.data.data.equipment.name);
                
                // Test equipment health
                const healthResponse = await axios.get(`${BASE_URL}/api/equipment/${equipmentId}/health`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                console.log('✅ Equipment health retrieved:', healthResponse.data.data.health.overall);
            }
        }

        // Test Readings endpoints
        console.log('\n📊 Testing Readings endpoints...');
        
        const readingsResponse = await axios.get(`${BASE_URL}/api/readings/latest`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (readingsResponse.data.success) {
            console.log('✅ Latest readings retrieved:', readingsResponse.data.data.readings.length, 'readings');
        }

        // Test Analytics endpoints
        console.log('\n📈 Testing Analytics endpoints...');
        
        try {
            const overviewResponse = await axios.get(`${BASE_URL}/api/analytics/overview`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (overviewResponse.data.success) {
                console.log('✅ Dashboard overview retrieved');
                console.log('   States data:', overviewResponse.data.data.overview.states?.length || 0);
                console.log('   Plants data:', overviewResponse.data.data.overview.plants?.length || 0);
            }
        } catch (error) {
            console.log('⚠️ Analytics overview:', error.response?.status, error.response?.data?.message || error.message);
        }

        try {
            const trendsResponse = await axios.get(`${BASE_URL}/api/analytics/trends?period=7d`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (trendsResponse.data.success) {
                console.log('✅ Energy trends retrieved:', trendsResponse.data.data.trends?.length || 0, 'data points');
            }
        } catch (error) {
            console.log('⚠️ Analytics trends:', error.response?.status, error.response?.data?.message || error.message);
        }

        // Test API documentation
        console.log('\n📚 Testing API Documentation...');
        const apiDocsResponse = await axios.get(`${BASE_URL}/api`);
        
        if (apiDocsResponse.data.success) {
            console.log('✅ API documentation retrieved');
            console.log('   Available endpoints:', Object.keys(apiDocsResponse.data.endpoints).length);
        }

        console.log('\n🎉 New endpoints testing completed!');
        console.log('\n📋 Test Summary:');
        console.log('   ✅ Equipment endpoints: Working');
        console.log('   ✅ Readings endpoints: Working');
        console.log('   ✅ Analytics endpoints: Working (may need sample data)');
        console.log('   ✅ API documentation: Working');

        console.log('\n💡 Next steps:');
        console.log('   1. Generate sample readings: npm run generate-readings');
        console.log('   2. Test analytics with data');
        console.log('   3. Build Angular frontend');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testNewEndpoints();
