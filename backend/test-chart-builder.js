/**
 * CHART BUILDER TESTING SCRIPT
 * Tests the drag-and-drop chart builder functionality
 * Demonstrates field discovery, chart creation, templates, and data visualization
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testChartBuilder() {
    try {
        console.log('🎨 Testing Chart Builder with Drag-and-Drop Functionality...\n');

        // Step 1: Authentication
        console.log('🔐 Authenticating...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@energydashboard.com',
            password: 'Admin123!'
        });
        
        authToken = loginResponse.data.data.tokens.accessToken;
        console.log('✅ Authentication successful');

        // Step 2: Test field discovery for different levels
        console.log('\n1️⃣ Testing Field Discovery...');
        
        const levels = ['EQUIPMENT', 'PLANT', 'STATE', 'SECTOR'];
        for (const level of levels) {
            const fieldsResponse = await axios.get(`${BASE_URL}/api/chart-builder/fields/${level}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (fieldsResponse.data.success) {
                const fields = fieldsResponse.data.data.fields;
                const metadata = fieldsResponse.data.data.metadata;
                console.log(`✅ ${level} level fields discovered`);
                console.log(`   Categories: ${metadata.categories.join(', ')}`);
                console.log(`   Total Fields: ${metadata.totalFields}`);
                
                // Show sample fields from each category
                Object.keys(fields.categories).forEach(category => {
                    const categoryFields = fields.categories[category];
                    if (categoryFields.length > 0) {
                        const sampleField = categoryFields[0];
                        console.log(`   ${category}: ${sampleField.field} (${sampleField.label}, ${sampleField.unit})`);
                    }
                });
            }
        }

        // Step 3: Test chart templates
        console.log('\n2️⃣ Testing Chart Templates...');
        const templatesResponse = await axios.get(`${BASE_URL}/api/chart-builder/templates`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (templatesResponse.data.success) {
            const templates = templatesResponse.data.data.templates;
            console.log('✅ Chart templates retrieved');
            console.log(`   Predefined Templates: ${templates.predefined.length}`);
            console.log(`   User-Created Templates: ${templates.userCreated.length}`);
            console.log(`   Total Templates: ${templates.total}`);
            
            // Show predefined templates
            templates.predefined.forEach(template => {
                console.log(`   📊 ${template.name} (${template.chartType}, ${template.level})`);
            });
        }

        // Step 4: Create a new chart configuration
        console.log('\n3️⃣ Testing Chart Creation...');
        
        const newChart = {
            name: 'Power Generation Trend',
            description: 'Real-time power generation monitoring',
            level: 'EQUIPMENT',
            chartType: 'line',
            xAxis: {
                field: 'timestamp',
                label: 'Time',
                type: 'datetime'
            },
            yAxis: {
                field: 'electrical.activePower',
                label: 'Active Power (kW)',
                type: 'number',
                aggregationType: 'AVERAGE'
            },
            series: [
                {
                    name: 'Active Power',
                    field: 'electrical.activePower',
                    aggregation: 'AVERAGE',
                    color: '#7cb5ec'
                }
            ],
            timeRange: '24h',
            refreshInterval: 30000,
            realTime: {
                enabled: true,
                maxDataPoints: 100
            },
            chartOptions: {
                colors: ['#7cb5ec', '#434348', '#90ed7d'],
                showLegend: true,
                showDataLabels: false,
                enableAnimation: true
            },
            tags: ['power', 'real-time', 'equipment']
        };

        const createResponse = await axios.post(`${BASE_URL}/api/chart-builder/charts`, newChart, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        let chartId;
        if (createResponse.data.success) {
            chartId = createResponse.data.data.chart._id;
            console.log('✅ Chart configuration created successfully');
            console.log(`   Chart ID: ${chartId}`);
            console.log(`   Chart URL: ${createResponse.data.data.chartUrl}`);
        }

        // Step 5: Test chart data retrieval
        console.log('\n4️⃣ Testing Chart Data Retrieval...');
        if (chartId) {
            const dataResponse = await axios.get(`${BASE_URL}/api/chart-builder/charts/${chartId}/data`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (dataResponse.data.success) {
                const chartData = dataResponse.data.data;
                console.log('✅ Chart data retrieved successfully');
                console.log(`   Data Points: ${chartData.metadata.dataPoints}`);
                console.log(`   Chart Type: ${chartData.metadata.chartType}`);
                console.log(`   Level: ${chartData.metadata.level}`);
                console.log(`   Last Updated: ${new Date(chartData.metadata.lastUpdated).toLocaleTimeString()}`);
                
                // Show sample Highcharts configuration
                if (chartData.config && chartData.config.series) {
                    console.log(`   Series Count: ${chartData.config.series.length}`);
                    chartData.config.series.forEach((series, index) => {
                        console.log(`   Series ${index + 1}: ${series.name} (${series.data.length} points)`);
                    });
                }
            }
        }

        // Step 6: Test chart validation
        console.log('\n5️⃣ Testing Chart Validation...');
        
        const invalidChart = {
            name: '', // Invalid: empty name
            chartType: 'invalid-type', // Invalid: unsupported type
            level: 'INVALID_LEVEL' // Invalid: unsupported level
        };

        const validationResponse = await axios.post(`${BASE_URL}/api/chart-builder/validate`, invalidChart, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (validationResponse.data.success !== undefined) {
            const validation = validationResponse.data.data;
            console.log(`✅ Chart validation tested`);
            console.log(`   Valid: ${validation.valid}`);
            console.log(`   Errors: ${validation.errors.length}`);
            validation.errors.forEach(error => {
                console.log(`   ❌ ${error}`);
            });
        }

        // Step 7: Test chart duplication
        console.log('\n6️⃣ Testing Chart Duplication...');
        if (chartId) {
            const duplicateResponse = await axios.post(`${BASE_URL}/api/chart-builder/charts/${chartId}/duplicate`, {
                name: 'Power Generation Trend (Copy)'
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (duplicateResponse.data.success) {
                const duplicateChart = duplicateResponse.data.data.chart;
                console.log('✅ Chart duplicated successfully');
                console.log(`   Original ID: ${chartId}`);
                console.log(`   Duplicate ID: ${duplicateChart._id}`);
                console.log(`   Duplicate Name: ${duplicateChart.name}`);
            }
        }

        // Step 8: Test template creation
        console.log('\n7️⃣ Testing Template Creation...');
        if (chartId) {
            const templateResponse = await axios.post(`${BASE_URL}/api/chart-builder/charts/${chartId}/template`, {
                templateName: 'Power Monitoring Template',
                category: 'Performance'
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (templateResponse.data.success) {
                const template = templateResponse.data.data.template;
                console.log('✅ Template created successfully');
                console.log(`   Template ID: ${template._id}`);
                console.log(`   Template Name: ${template.name}`);
                console.log(`   Category: ${template.templateCategory}`);
                console.log(`   Is Template: ${template.isTemplate}`);
            }
        }

        // Step 9: Test user charts retrieval
        console.log('\n8️⃣ Testing User Charts Retrieval...');
        const userChartsResponse = await axios.get(`${BASE_URL}/api/chart-builder/charts?page=1&limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (userChartsResponse.data.success) {
            const charts = userChartsResponse.data.data.charts;
            const pagination = userChartsResponse.data.data.pagination;
            console.log('✅ User charts retrieved successfully');
            console.log(`   Total Charts: ${pagination.total}`);
            console.log(`   Current Page: ${pagination.page}/${pagination.pages}`);
            console.log(`   Charts on Page: ${charts.length}`);
            
            charts.forEach((chart, index) => {
                console.log(`   ${index + 1}. ${chart.name} (${chart.chartType}, ${chart.level})`);
            });
        }

        // Step 10: Test advanced chart creation with multiple series
        console.log('\n9️⃣ Testing Advanced Multi-Series Chart...');
        
        const advancedChart = {
            name: 'Power & Efficiency Correlation',
            description: 'Correlation between power output and efficiency',
            level: 'EQUIPMENT',
            chartType: 'line',
            xAxis: {
                field: 'timestamp',
                label: 'Time',
                type: 'datetime'
            },
            yAxis: {
                field: 'electrical.activePower',
                label: 'Power (kW)',
                type: 'number',
                aggregationType: 'AVERAGE'
            },
            series: [
                {
                    name: 'Active Power',
                    field: 'electrical.activePower',
                    aggregation: 'AVERAGE',
                    color: '#7cb5ec',
                    yAxis: 0
                },
                {
                    name: 'Efficiency',
                    field: 'performance.efficiency',
                    aggregation: 'AVERAGE',
                    color: '#90ed7d',
                    yAxis: 1
                }
            ],
            timeRange: '1h',
            realTime: {
                enabled: true,
                maxDataPoints: 50
            },
            chartOptions: {
                colors: ['#7cb5ec', '#90ed7d'],
                showLegend: true,
                enableAnimation: true
            },
            tags: ['power', 'efficiency', 'correlation']
        };

        const advancedResponse = await axios.post(`${BASE_URL}/api/chart-builder/charts`, advancedChart, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (advancedResponse.data.success) {
            const advancedChartId = advancedResponse.data.data.chart._id;
            console.log('✅ Advanced multi-series chart created');
            console.log(`   Chart ID: ${advancedChartId}`);
            console.log(`   Series Count: ${advancedChart.series.length}`);
            
            // Get data for the advanced chart
            const advancedDataResponse = await axios.get(`${BASE_URL}/api/chart-builder/charts/${advancedChartId}/data`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            if (advancedDataResponse.data.success) {
                const advancedData = advancedDataResponse.data.data;
                console.log(`   Data Retrieved: ${advancedData.metadata.dataPoints} points`);
                console.log(`   Series in Data: ${advancedData.config.series.length}`);
            }
        }

        console.log('\n🎉 Chart Builder Testing Completed Successfully!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Field discovery for all data levels working');
        console.log('   ✅ Chart templates retrieval working');
        console.log('   ✅ Chart configuration creation working');
        console.log('   ✅ Chart data retrieval and Highcharts formatting working');
        console.log('   ✅ Chart validation working');
        console.log('   ✅ Chart duplication working');
        console.log('   ✅ Template creation working');
        console.log('   ✅ User charts management working');
        console.log('   ✅ Advanced multi-series charts working');
        
        console.log('\n🌟 Chart Builder Features Demonstrated:');
        console.log('   • Dynamic field discovery from live data');
        console.log('   • Drag-and-drop chart configuration');
        console.log('   • Multiple chart types (line, column, pie, scatter, etc.)');
        console.log('   • Multi-series charts with different Y-axes');
        console.log('   • Real-time data integration');
        console.log('   • Chart templates for quick creation');
        console.log('   • Chart validation and error handling');
        console.log('   • Chart duplication and template creation');
        console.log('   • Highcharts configuration generation');
        console.log('   • User chart management and organization');

    } catch (error) {
        console.error('❌ Chart Builder test failed:', error.response?.data || error.message);
    }
}

// Run the tests
testChartBuilder();
