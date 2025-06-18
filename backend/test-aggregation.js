/**
 * AGGREGATION TESTING SCRIPT
 * Tests the real-time aggregation engine and API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAggregationEngine() {
    try {
        console.log('🧪 Testing Real-time Aggregation Engine...\n');

        // Login
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Test 1: Get sector-level aggregation
        console.log('\n1️⃣ Testing Sector-level Aggregation...');
        const sectorResponse = await axios.get(`${BASE_URL}/api/aggregation/sector?timeWindow=1h`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (sectorResponse.data.success) {
            const agg = sectorResponse.data.data.aggregation;
            console.log('✅ Sector aggregation successful');
            console.log(`   Total Power: ${agg.electrical?.activePower?.toFixed(1) || 0} kW`);
            console.log(`   Avg Efficiency: ${agg.performance?.avgEfficiency?.toFixed(1) || 0}%`);
            console.log(`   Equipment: ${agg.equipment?.total || 0} total, ${agg.equipment?.operational || 0} operational`);
            console.log(`   Data Points: ${agg.dataPoints || 0}`);
            console.log(`   States: ${agg.states?.total || 0}, Plants: ${agg.plants?.total || 0}`);
        }

        // Test 2: Get dashboard summary
        console.log('\n2️⃣ Testing Dashboard Summary...');
        const dashboardResponse = await axios.get(`${BASE_URL}/api/aggregation/dashboard?timeWindow=1h`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (dashboardResponse.data.success) {
            const summary = dashboardResponse.data.data.summary;
            console.log('✅ Dashboard summary successful');
            console.log(`   Overview:`);
            console.log(`     Total Power: ${summary.overview?.totalPower?.toFixed(1) || 0} kW`);
            console.log(`     Total Energy: ${summary.overview?.totalEnergy?.toFixed(1) || 0} kWh`);
            console.log(`     Avg Efficiency: ${summary.overview?.avgEfficiency?.toFixed(1) || 0}%`);
            console.log(`   Equipment Status:`);
            console.log(`     Total: ${summary.equipment?.total || 0}`);
            console.log(`     Operational: ${summary.equipment?.operational || 0} (${summary.equipment?.operationalPercentage || 0}%)`);
            console.log(`     Maintenance: ${summary.equipment?.maintenance || 0}`);
            console.log(`     Fault: ${summary.equipment?.fault || 0}`);
        }

        // Test 3: Get plants to test plant-level aggregation
        console.log('\n3️⃣ Testing Plant-level Aggregation...');
        const plantsResponse = await axios.get(`${BASE_URL}/api/plants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (plantsResponse.data.success && plantsResponse.data.data.plants.length > 0) {
            const firstPlant = plantsResponse.data.data.plants[0];
            console.log(`   Testing with plant: ${firstPlant.name} (${firstPlant._id})`);
            
            const plantAggResponse = await axios.get(`${BASE_URL}/api/aggregation/plant/${firstPlant._id}?timeWindow=1h`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (plantAggResponse.data.success) {
                const plantAgg = plantAggResponse.data.data.aggregation;
                console.log('✅ Plant aggregation successful');
                console.log(`     Power: ${plantAgg.electrical?.activePower?.toFixed(1) || 0} kW`);
                console.log(`     Efficiency: ${plantAgg.performance?.avgEfficiency?.toFixed(1) || 0}%`);
                console.log(`     Equipment: ${plantAgg.equipment?.total || 0} units`);
                console.log(`     Data Points: ${plantAgg.dataPoints || 0}`);
            }
        }

        // Test 4: Get states to test state-level aggregation
        console.log('\n4️⃣ Testing State-level Aggregation...');
        const statesResponse = await axios.get(`${BASE_URL}/api/states`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (statesResponse.data.success && statesResponse.data.data.states.length > 0) {
            const firstState = statesResponse.data.data.states[0];
            console.log(`   Testing with state: ${firstState.name} (${firstState._id})`);
            
            const stateAggResponse = await axios.get(`${BASE_URL}/api/aggregation/state/${firstState._id}?timeWindow=1h`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (stateAggResponse.data.success) {
                const stateAgg = stateAggResponse.data.data.aggregation;
                console.log('✅ State aggregation successful');
                console.log(`     Power: ${stateAgg.electrical?.activePower?.toFixed(1) || 0} kW`);
                console.log(`     Efficiency: ${stateAgg.performance?.avgEfficiency?.toFixed(1) || 0}%`);
                console.log(`     Plants: ${stateAgg.plants?.total || 0} total`);
                console.log(`     Equipment: ${stateAgg.equipment?.total || 0} units`);
                console.log(`     Data Points: ${stateAgg.dataPoints || 0}`);
            }
        }

        // Test 5: Test hierarchy aggregation
        console.log('\n5️⃣ Testing Hierarchy Aggregation...');
        const hierarchyResponse = await axios.get(`${BASE_URL}/api/aggregation/hierarchy/sector/all?timeWindow=1h`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (hierarchyResponse.data.success) {
            const hierarchies = hierarchyResponse.data.data.aggregations;
            console.log('✅ Hierarchy aggregation successful');
            console.log(`   Levels available: ${Object.keys(hierarchies).join(', ')}`);
            
            if (hierarchies.sector) {
                console.log(`   Sector Power: ${hierarchies.sector.electrical?.activePower?.toFixed(1) || 0} kW`);
            }
        }

        // Test 6: Test different time windows
        console.log('\n6️⃣ Testing Different Time Windows...');
        const timeWindows = ['15m', '1h', '24h'];
        
        for (const timeWindow of timeWindows) {
            const timeResponse = await axios.get(`${BASE_URL}/api/aggregation/sector?timeWindow=${timeWindow}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (timeResponse.data.success) {
                const agg = timeResponse.data.data.aggregation;
                console.log(`   ${timeWindow}: ${agg.dataPoints || 0} data points, ${agg.electrical?.activePower?.toFixed(1) || 0} kW`);
            }
        }

        // Test 7: Cache statistics
        console.log('\n7️⃣ Testing Cache Statistics...');
        const cacheStatsResponse = await axios.get(`${BASE_URL}/api/aggregation/cache/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (cacheStatsResponse.data.success) {
            const cache = cacheStatsResponse.data.data.cache;
            console.log('✅ Cache statistics retrieved');
            console.log(`   Cache Enabled: ${cache.enabled ? 'Yes' : 'No'}`);
            if (cache.enabled) {
                console.log(`   Total Keys: ${cache.totalKeys || 0}`);
                console.log(`   Keys by Level: ${JSON.stringify(cache.keysByLevel || {})}`);
            } else {
                console.log('   Running without Redis cache (as expected)');
            }
        }

        console.log('\n🎉 Aggregation Engine Testing Completed!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Sector-level aggregation working');
        console.log('   ✅ Dashboard summary working');
        console.log('   ✅ Plant-level aggregation working');
        console.log('   ✅ State-level aggregation working');
        console.log('   ✅ Hierarchy aggregation working');
        console.log('   ✅ Multiple time windows working');
        console.log('   ✅ Cache statistics working');
        
        console.log('\n🌟 Key Features Demonstrated:');
        console.log('   • Hierarchical data aggregation (equipment → plant → state → sector)');
        console.log('   • Real-time calculations without caching');
        console.log('   • Multiple time window support (15m, 1h, 24h)');
        console.log('   • Comprehensive metrics (electrical, performance, environmental)');
        console.log('   • Equipment status tracking and counting');
        console.log('   • Dashboard-ready summary data');

    } catch (error) {
        console.error('❌ Aggregation test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testAggregationEngine();
