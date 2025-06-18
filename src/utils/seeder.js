const mongoose = require('mongoose');
const { State, Plant, Equipment, User } = require('../models');

/**
 * DATABASE SEEDER
 * Populates the database with realistic sample data for testing and development
 */

class DatabaseSeeder {
    constructor() {
        this.states = [];
        this.plants = [];
        this.users = [];
    }

    /**
     * Seed all data
     */
    async seedAll() {
        try {
            console.log('🌱 Starting database seeding...');

            // Clear existing data
            await this.clearDatabase();

            // Seed in order (due to dependencies)
            await this.seedUsers();
            await this.seedStates();
            await this.seedPlants();
            await this.seedEquipment();

            console.log('✅ Database seeding completed successfully!');

        } catch (error) {
            console.error('❌ Seeding failed:', error);
            throw error;
        }
    }

    /**
     * Clear existing data
     */
    async clearDatabase() {
        console.log('🧹 Clearing existing data...');

        try {
            // Drop collections to remove indexes
            await mongoose.connection.db.dropCollection('equipment').catch(() => { });
            await mongoose.connection.db.dropCollection('plants').catch(() => { });
            await mongoose.connection.db.dropCollection('states').catch(() => { });
            await mongoose.connection.db.dropCollection('users').catch(() => { });

            console.log('✅ Database cleared');
        } catch (error) {
            console.log('⚠️ Some collections may not exist, continuing...');
        }
    }

    /**
     * Seed Users
     */
    async seedUsers() {
        console.log('👥 Seeding users...');

        const usersData = [
            {
                personalInfo: {
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@energydashboard.com'
                },
                authentication: {
                    password: 'Admin123!'
                },
                authorization: {
                    role: 'Super Admin'
                },
                status: { isActive: true, isVerified: true }
            },
            {
                personalInfo: {
                    firstName: 'Rajesh',
                    lastName: 'Sharma',
                    email: 'rajesh.sharma@energydashboard.com'
                },
                authentication: {
                    password: 'Manager123!'
                },
                authorization: {
                    role: 'Plant Manager'
                },
                professional: {
                    department: 'Operations',
                    designation: 'Senior Plant Manager'
                },
                status: { isActive: true, isVerified: true }
            },
            {
                personalInfo: {
                    firstName: 'Priya',
                    lastName: 'Patel',
                    email: 'priya.patel@energydashboard.com'
                },
                authentication: {
                    password: 'Analyst123!'
                },
                authorization: {
                    role: 'Analyst'
                },
                professional: {
                    department: 'Analytics',
                    designation: 'Data Analyst'
                },
                status: { isActive: true, isVerified: true }
            }
        ];

        this.users = [];
        for (const userData of usersData) {
            const user = new User(userData);
            await user.save();
            this.users.push(user);
        }
        console.log(`✅ Created ${this.users.length} users`);
    }

    /**
     * Seed States
     */
    async seedStates() {
        console.log('🏛️ Seeding states...');

        const statesData = [
            {
                name: 'Gujarat',
                code: 'GJ',
                geography: {
                    coordinates: { latitude: 23.0225, longitude: 72.5714 },
                    area: { total: 196244, coastal: 1600, desert: 19500 },
                    climate: 'Arid',
                    averageTemperature: { summer: 42, winter: 15, monsoon: 32 },
                    rainfall: { annual: 550, monsoon: 450 }
                },
                energyProfile: {
                    totalCapacity: 28000,
                    renewableCapacity: 12500,
                    capacityBySource: {
                        solar: 7500, wind: 3500, hydro: 1500, thermal: 15000
                    }
                },
                renewablePotential: {
                    solar: {
                        technical: 35000,
                        economic: 25000,
                        solarIrradiation: 5.5,
                        suitableLand: 15000
                    },
                    wind: {
                        technical: 10000,
                        economic: 7500,
                        averageWindSpeed: 7.2,
                        windyDays: 280
                    }
                },
                createdBy: this.users[0]._id
            },
            {
                name: 'Rajasthan',
                code: 'RJ',
                geography: {
                    coordinates: { latitude: 27.0238, longitude: 74.2179 },
                    area: { total: 342239, desert: 200000 },
                    climate: 'Arid',
                    averageTemperature: { summer: 45, winter: 10, monsoon: 35 },
                    rainfall: { annual: 400, monsoon: 350 }
                },
                energyProfile: {
                    totalCapacity: 25000,
                    renewableCapacity: 15000,
                    capacityBySource: {
                        solar: 8500, wind: 4500, hydro: 2000, thermal: 10000
                    }
                },
                renewablePotential: {
                    solar: {
                        technical: 50000,
                        economic: 35000,
                        solarIrradiation: 6.2,
                        suitableLand: 25000
                    },
                    wind: {
                        technical: 15000,
                        economic: 10000,
                        averageWindSpeed: 8.1,
                        windyDays: 300
                    }
                },
                createdBy: this.users[0]._id
            },
            {
                name: 'Karnataka',
                code: 'KA',
                geography: {
                    coordinates: { latitude: 15.3173, longitude: 75.7139 },
                    area: { total: 191791, coastal: 320, forest: 38720 },
                    climate: 'Tropical',
                    averageTemperature: { summer: 35, winter: 20, monsoon: 28 },
                    rainfall: { annual: 1200, monsoon: 900 }
                },
                energyProfile: {
                    totalCapacity: 22000,
                    renewableCapacity: 13500,
                    capacityBySource: {
                        solar: 6500, wind: 5000, hydro: 2000, thermal: 8500
                    }
                },
                renewablePotential: {
                    solar: {
                        technical: 24000,
                        economic: 18000,
                        solarIrradiation: 5.8,
                        suitableLand: 12000
                    },
                    wind: {
                        technical: 12000,
                        economic: 8500,
                        averageWindSpeed: 7.8,
                        windyDays: 250
                    },
                    hydro: {
                        technical: 8000,
                        economic: 6000,
                        majorRivers: ['Kaveri', 'Krishna', 'Tungabhadra'],
                        reservoirCapacity: 15000
                    }
                },
                createdBy: this.users[0]._id
            }
        ];

        this.states = await State.insertMany(statesData);
        console.log(`✅ Created ${this.states.length} states`);
    }

    /**
     * Seed Plants
     */
    async seedPlants() {
        console.log('🏭 Seeding plants...');

        const plantsData = [
            {
                name: 'Charanka Solar Park',
                plantId: 'GJ-SOL-001',
                type: 'Solar',
                subType: 'Utility Scale Solar',
                location: {
                    state: this.states[0]._id, // Gujarat
                    district: 'Patan',
                    coordinates: { latitude: 23.8103, longitude: 71.2136 }
                },
                technical: {
                    capacity: { installed: 590, operational: 580 },
                    solar: {
                        panelType: 'Monocrystalline',
                        panelCount: 2360000,
                        trackingSystem: 'Single Axis',
                        moduleEfficiency: 20.5,
                        dcAcRatio: 1.3
                    }
                },
                financial: {
                    projectCost: 2950,
                    tariff: 2.44,
                    lcoe: 2.15
                },
                status: 'Operational',
                createdBy: this.users[0]._id
            },
            {
                name: 'Jaisalmer Wind Park',
                plantId: 'RJ-WND-001',
                type: 'Wind',
                subType: 'Onshore Wind',
                location: {
                    state: this.states[1]._id, // Rajasthan
                    district: 'Jaisalmer',
                    coordinates: { latitude: 26.9157, longitude: 70.9083 }
                },
                technical: {
                    capacity: { installed: 1064, operational: 1050 },
                    wind: {
                        turbineModel: 'Vestas V120-2.2MW',
                        turbineCount: 484,
                        hubHeight: 90,
                        rotorDiameter: 120
                    }
                },
                financial: {
                    projectCost: 5320,
                    tariff: 2.83,
                    lcoe: 2.65
                },
                status: 'Operational',
                createdBy: this.users[0]._id
            },
            {
                name: 'Sharavathi Hydro Plant',
                plantId: 'KA-HYD-001',
                type: 'Hydro',
                subType: 'Reservoir',
                location: {
                    state: this.states[2]._id, // Karnataka
                    district: 'Shimoga',
                    coordinates: { latitude: 14.1024, longitude: 74.8335 }
                },
                technical: {
                    capacity: { installed: 1035, operational: 1035 },
                    hydro: {
                        damHeight: 58,
                        reservoirCapacity: 4368,
                        turbineType: 'Francis',
                        turbineCount: 10
                    }
                },
                financial: {
                    projectCost: 3500,
                    tariff: 3.20,
                    lcoe: 2.95
                },
                status: 'Operational',
                createdBy: this.users[0]._id
            }
        ];

        this.plants = await Plant.insertMany(plantsData);
        console.log(`✅ Created ${this.plants.length} plants`);
    }

    /**
     * Seed Equipment
     */
    async seedEquipment() {
        console.log('⚡ Seeding equipment...');

        const equipmentData = [];

        // Solar equipment for Charanka Solar Park
        for (let i = 1; i <= 5; i++) {
            equipmentData.push({
                name: `Solar Inverter SI-${i.toString().padStart(3, '0')}`,
                equipmentId: `GJ-SOL-SI-${i.toString().padStart(3, '0')}`,
                type: 'Solar Inverter',
                plant: this.plants[0]._id,
                specifications: {
                    manufacturer: 'ABB',
                    model: 'PVS980-CS',
                    serialNumber: `ABB-SI-${Date.now()}-${i}`,
                    ratings: { power: 2500, voltage: 1500, efficiency: 98.5 }
                },
                performance: {
                    currentStatus: 'Online',
                    availability: 98.5,
                    currentEfficiency: 97.8
                }
            });
        }

        // Wind equipment for Jaisalmer Wind Park
        for (let i = 1; i <= 3; i++) {
            equipmentData.push({
                name: `Wind Turbine WT-${i.toString().padStart(3, '0')}`,
                equipmentId: `RJ-WND-WT-${i.toString().padStart(3, '0')}`,
                type: 'Wind Turbine',
                plant: this.plants[1]._id,
                specifications: {
                    manufacturer: 'Vestas',
                    model: 'V120-2.2MW',
                    serialNumber: `VES-WT-${Date.now()}-${i}`,
                    ratings: { power: 2200, voltage: 690 }
                },
                performance: {
                    currentStatus: 'Online',
                    availability: 96.2,
                    currentEfficiency: 94.5
                }
            });
        }

        await Equipment.insertMany(equipmentData);
        console.log(`✅ Created ${equipmentData.length} equipment units`);
    }
}

module.exports = DatabaseSeeder;
