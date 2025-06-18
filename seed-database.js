/**
 * DATABASE SEEDING SCRIPT
 * Run this script to populate the database with sample data
 * Usage: node seed-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DatabaseSeeder = require('./src/utils/seeder');

async function runSeeder() {
    try {
        console.log('🚀 Starting database seeding process...');
        
        // Connect to MongoDB
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard';
        console.log('🔄 Connecting to MongoDB...');
        
        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB');
        
        // Run seeder
        const seeder = new DatabaseSeeder();
        await seeder.seedAll();
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Sample data created:');
        console.log('   👥 Users: 3 (Admin, Plant Manager, Analyst)');
        console.log('   🏛️ States: 3 (Gujarat, Rajasthan, Karnataka)');
        console.log('   🏭 Plants: 3 (Solar, Wind, Hydro)');
        console.log('   ⚡ Equipment: 8 units');
        
        console.log('\n🔐 Login credentials:');
        console.log('   Admin: admin@energydashboard.com / Admin123!');
        console.log('   Manager: rajesh.sharma@energydashboard.com / Manager123!');
        console.log('   Analyst: priya.patel@energydashboard.com / Analyst123!');
        
        console.log('\n🌐 API Endpoints:');
        console.log('   Health: GET http://localhost:3001/health');
        console.log('   API Info: GET http://localhost:3001/api');
        console.log('   Login: POST http://localhost:3001/api/auth/login');
        console.log('   States: GET http://localhost:3001/api/states');
        console.log('   Plants: GET http://localhost:3001/api/plants');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
        process.exit(0);
    }
}

// Run the seeder
runSeeder();
