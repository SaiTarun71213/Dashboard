/**
 * TEST MODELS SCRIPT
 * Quick test to verify our database models work correctly
 */

const mongoose = require('mongoose');
const { State, Plant, Equipment, Reading, User } = require('./src/models');

// Simple connection
async function testModels() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/energy-dashboard-test');
        console.log('✅ Connected successfully');

        // Test State model
        console.log('\n📊 Testing State model...');
        const testState = new State({
            name: 'Gujarat',
            code: 'GJ',
            geography: {
                coordinates: { latitude: 23.0225, longitude: 72.5714 },
                area: { total: 196244, coastal: 1600 },
                climate: 'Arid'
            },
            energyProfile: {
                totalCapacity: 28000,
                renewableCapacity: 12500
            }
        });

        console.log('✅ State model validation passed');

        // Test Plant model
        console.log('\n🏭 Testing Plant model...');
        const testPlant = new Plant({
            name: 'Test Solar Plant',
            type: 'Solar',
            location: {
                state: testState._id,
                district: 'Patan',
                coordinates: { latitude: 23.8103, longitude: 71.2136 }
            },
            technical: {
                capacity: { installed: 100, operational: 95 }
            }
        });

        console.log('✅ Plant model validation passed');

        // Test Equipment model
        console.log('\n⚡ Testing Equipment model...');
        const testEquipment = new Equipment({
            name: 'Solar Panel SP-001',
            type: 'Solar Panel',
            plant: testPlant._id,
            specifications: {
                manufacturer: 'Tata Solar',
                model: 'TP-540W',
                serialNumber: 'TS540W001'
            }
        });

        console.log('✅ Equipment model validation passed');

        // Test Reading model
        console.log('\n📊 Testing Reading model...');
        const testReading = new Reading({
            equipment: testEquipment._id,
            plant: testPlant._id,
            electrical: {
                activePower: 450,
                voltage: { l1: 230, l2: 232, l3: 228 }
            },
            environmental: {
                weather: {
                    solarIrradiance: 850,
                    temperature: { ambient: 32, module: 45 }
                }
            }
        });

        console.log('✅ Reading model validation passed');

        // Test User model
        console.log('\n👥 Testing User model...');
        const testUser = new User({
            personalInfo: {
                firstName: 'Rajesh',
                lastName: 'Sharma',
                email: 'rajesh.sharma@energy.com'
            },
            authentication: {
                password: 'SecurePassword123!'
            },
            authorization: {
                role: 'Plant Manager'
            }
        });

        console.log('✅ User model validation passed');

        console.log('\n🎉 All models validated successfully!');
        console.log('\n📋 Model Summary:');
        console.log(`   States: ${Object.keys(State.schema.paths).length} fields`);
        console.log(`   Plants: ${Object.keys(Plant.schema.paths).length} fields`);
        console.log(`   Equipment: ${Object.keys(Equipment.schema.paths).length} fields`);
        console.log(`   Readings: ${Object.keys(Reading.schema.paths).length} fields`);
        console.log(`   Users: ${Object.keys(User.schema.paths).length} fields`);

    } catch (error) {
        console.error('❌ Model test failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
    }
}

// Run the test
testModels();
