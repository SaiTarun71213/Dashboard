/**
 * GENERATE SAMPLE READINGS SCRIPT
 * Creates realistic time-series data for testing analytics
 * Usage: node generate-readings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SampleReadingsGenerator = require('./src/utils/sampleReadings');

async function generateReadings() {
    try {
        console.log('🚀 Starting sample readings generation...');
        
        // Connect to MongoDB
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard';
        console.log('🔄 Connecting to MongoDB...');
        
        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB');
        
        // Generate sample readings
        const generator = new SampleReadingsGenerator();
        await generator.generateSampleReadings();
        
        console.log('\n🎉 Sample readings generation completed successfully!');
        console.log('\n📊 What was created:');
        console.log('   📈 Time-series data for last 7 days');
        console.log('   ⏱️ Readings every 15 minutes');
        console.log('   🌞 Solar: Irradiance-based power generation');
        console.log('   💨 Wind: Wind speed-based power curves');
        console.log('   💧 Hydro: Water flow-based generation');
        
        console.log('\n🌐 Test the analytics endpoints:');
        console.log('   Dashboard: GET http://localhost:3000/api/analytics/overview');
        console.log('   Trends: GET http://localhost:3000/api/analytics/trends');
        console.log('   Charts: GET http://localhost:3000/api/readings/chart-data');
        console.log('   Latest: GET http://localhost:3000/api/readings/latest');
        
    } catch (error) {
        console.error('❌ Sample readings generation failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
        process.exit(0);
    }
}

// Run the generator
generateReadings();
