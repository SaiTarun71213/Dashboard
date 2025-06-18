/**
 * USER TESTING SCRIPT
 * Tests user creation and authentication
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./src/models');

async function testUser() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard');
        console.log('✅ Connected to MongoDB');

        // Find the admin user
        console.log('\n🔍 Finding admin user...');
        const adminUser = await User.findOne({ 'personalInfo.email': 'admin@energydashboard.com' })
            .select('+authentication.password');

        if (adminUser) {
            console.log('✅ Admin user found:', adminUser.personalInfo.email);
            console.log('   Name:', adminUser.fullName);
            console.log('   Role:', adminUser.authorization.role);
            console.log('   Password hash exists:', !!adminUser.authentication.password);

            // Test password verification
            console.log('\n🔐 Testing password verification...');
            const isPasswordCorrect = await adminUser.correctPassword('Admin123!');
            console.log('   Password "Admin123!" is correct:', isPasswordCorrect);

            // Test wrong password
            const isWrongPassword = await adminUser.correctPassword('wrongpassword');
            console.log('   Password "wrongpassword" is correct:', isWrongPassword);

        } else {
            console.log('❌ Admin user not found');
        }

        // List all users
        console.log('\n👥 All users in database:');
        const allUsers = await User.find({}).select('personalInfo.email personalInfo.firstName personalInfo.lastName authorization.role');
        allUsers.forEach(user => {
            console.log(`   - ${user.personalInfo.email} (${user.fullName}) - ${user.authorization.role}`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
    }
}

testUser();
