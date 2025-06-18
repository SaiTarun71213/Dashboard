/**
 * PASSWORD TESTING SCRIPT
 * Tests password hashing and verification
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function testPassword() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-dashboard');
        console.log('✅ Connected to MongoDB');

        // Test 1: Direct bcrypt test
        console.log('\n🔐 Testing bcrypt directly...');
        const testPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        console.log('   Original password:', testPassword);
        console.log('   Hashed password:', hashedPassword);
        
        const isMatch = await bcrypt.compare(testPassword, hashedPassword);
        console.log('   Direct bcrypt comparison:', isMatch);

        // Test 2: Create a new user and test immediately
        console.log('\n👤 Creating test user...');
        
        // Delete test user if exists
        await User.deleteOne({ 'personalInfo.email': 'test@test.com' });
        
        const testUser = new User({
            personalInfo: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com'
            },
            authentication: {
                password: testPassword
            },
            authorization: {
                role: 'Viewer'
            },
            status: { isActive: true }
        });

        await testUser.save();
        console.log('✅ Test user created');

        // Test password immediately after creation
        const savedUser = await User.findOne({ 'personalInfo.email': 'test@test.com' })
            .select('+authentication.password');
        
        console.log('   Saved password hash:', savedUser.authentication.password);
        
        const passwordCheck = await savedUser.correctPassword(testPassword);
        console.log('   Password verification result:', passwordCheck);

        // Test 3: Check existing admin user's password structure
        console.log('\n🔍 Checking admin user password...');
        const adminUser = await User.findOne({ 'personalInfo.email': 'admin@energydashboard.com' })
            .select('+authentication.password');
        
        if (adminUser) {
            console.log('   Admin password hash:', adminUser.authentication.password);
            console.log('   Hash length:', adminUser.authentication.password?.length);
            console.log('   Hash starts with $2b$:', adminUser.authentication.password?.startsWith('$2b$'));
            
            // Try manual bcrypt compare
            const manualCheck = await bcrypt.compare('Admin123!', adminUser.authentication.password);
            console.log('   Manual bcrypt compare:', manualCheck);
        }

        // Clean up
        await User.deleteOne({ 'personalInfo.email': 'test@test.com' });

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
    }
}

testPassword();
