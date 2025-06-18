const { Equipment, Reading } = require('../models');
const cron = require('node-cron');

/**
 * LIVE DATA SIMULATOR
 * Generates realistic SCADA data for energy equipment
 * Simulates day/night cycles, weather patterns, and equipment behavior
 */

class LiveDataSimulator {
    constructor() {
        this.isRunning = false;
        this.cronJob = null;
        this.equipment = [];
        this.simulationStartTime = null;
        this.readingCount = 0;
        this.lastLogTime = Date.now();

        // Simulation parameters
        this.config = {
            interval: '*/1 * * * *', // Every minute
            batchSize: 50, // Process equipment in batches
            weatherVariation: 0.2, // 20% weather variation
            equipmentFailureRate: 0.001, // 0.1% chance of equipment issues
            seasonalFactor: this.getSeasonalFactor()
        };
    }

    /**
     * Start the live data simulation
     */
    async start() {
        try {
            if (this.isRunning) {
                console.log('⚠️ Simulation is already running');
                return;
            }

            console.log('🚀 Starting Live Data Simulation...');

            // Load all equipment
            await this.loadEquipment();

            if (this.equipment.length === 0) {
                console.log('❌ No equipment found. Please seed the database first.');
                return;
            }

            // Start the cron job
            this.cronJob = cron.schedule(this.config.interval, async () => {
                await this.generateReadings();
            }, {
                scheduled: false
            });

            this.cronJob.start();
            this.isRunning = true;
            this.simulationStartTime = new Date();

            console.log('✅ Live Data Simulation started successfully!');
            console.log(`📊 Simulating data for ${this.equipment.length} equipment units`);
            console.log(`⏱️ Generating readings every minute`);
            console.log(`🌍 Seasonal factor: ${this.config.seasonalFactor.toFixed(2)}`);

            // Generate initial reading
            await this.generateReadings();

        } catch (error) {
            console.error('❌ Failed to start simulation:', error);
            this.isRunning = false;
        }
    }

    /**
     * Stop the live data simulation
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Simulation is not running');
            return;
        }

        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob.destroy();
            this.cronJob = null;
        }

        this.isRunning = false;
        const duration = Date.now() - this.simulationStartTime.getTime();
        const minutes = Math.round(duration / 60000);

        console.log('🛑 Live Data Simulation stopped');
        console.log(`📊 Generated ${this.readingCount} readings over ${minutes} minutes`);
        console.log(`📈 Average: ${(this.readingCount / Math.max(minutes, 1)).toFixed(1)} readings/minute`);
    }

    /**
     * Get simulation status
     */
    getStatus() {
        const uptime = this.isRunning ? Date.now() - this.simulationStartTime.getTime() : 0;

        return {
            isRunning: this.isRunning,
            equipmentCount: this.equipment.length,
            readingCount: this.readingCount,
            uptime: Math.round(uptime / 1000), // seconds
            lastReading: this.lastLogTime,
            config: this.config
        };
    }

    /**
     * Load equipment from database
     */
    async loadEquipment() {
        try {
            // First, let's see what equipment we have
            const allEquipment = await Equipment.find({})
                .populate('plant', 'name type location')
                .lean();

            console.log(`📋 Found ${allEquipment.length} total equipment units`);

            // Check status values
            const statusCounts = allEquipment.reduce((acc, eq) => {
                const status = eq.performance?.currentStatus || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            console.log('📊 Equipment status distribution:', statusCounts);

            // Use all equipment for simulation (we can filter later if needed)
            this.equipment = allEquipment;

            console.log(`📋 Loaded ${this.equipment.length} equipment units for simulation`);

            // Group by plant type for logging
            const typeGroups = this.equipment.reduce((acc, eq) => {
                const type = eq.plant.type;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});

            Object.entries(typeGroups).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} units`);
            });

        } catch (error) {
            console.error('❌ Failed to load equipment:', error);
            this.equipment = [];
        }
    }

    /**
     * Generate readings for all equipment
     */
    async generateReadings() {
        try {
            const startTime = Date.now();
            const timestamp = new Date();
            const readings = [];

            // Generate readings for all equipment
            for (const equipment of this.equipment) {
                const reading = this.generateEquipmentReading(equipment, timestamp);
                readings.push(reading);
            }

            // Bulk insert readings
            if (readings.length > 0) {
                await Reading.insertMany(readings);
                this.readingCount += readings.length;
            }

            const duration = Date.now() - startTime;

            // Log progress every 5 minutes
            if (Date.now() - this.lastLogTime > 5 * 60 * 1000) {
                console.log(`📊 Generated ${readings.length} readings in ${duration}ms`);
                console.log(`📈 Total readings: ${this.readingCount}`);
                this.lastLogTime = Date.now();
            }

        } catch (error) {
            console.error('❌ Failed to generate readings:', error);
        }
    }

    /**
     * Generate a single equipment reading
     */
    generateEquipmentReading(equipment, timestamp) {
        const plantType = equipment.plant.type;
        const hour = timestamp.getHours();
        const minute = timestamp.getMinutes();

        // Base reading structure
        let reading = {
            equipment: equipment._id,
            plant: equipment.plant._id,
            timestamp,
            dataQuality: {
                source: 'SCADA_SIM',
                confidence: 95 + Math.random() * 5,
                validated: true
            }
        };

        // Generate type-specific data
        switch (plantType) {
            case 'Solar':
                reading = { ...reading, ...this.generateSolarReading(equipment, timestamp, hour, minute) };
                break;
            case 'Wind':
                reading = { ...reading, ...this.generateWindReading(equipment, timestamp, hour, minute) };
                break;
            case 'Hydro':
                reading = { ...reading, ...this.generateHydroReading(equipment, timestamp, hour, minute) };
                break;
            default:
                reading = { ...reading, ...this.generateGenericReading(equipment, timestamp) };
        }

        return reading;
    }

    /**
     * Generate solar-specific reading with realistic patterns
     */
    generateSolarReading(equipment, timestamp, hour, minute) {
        const ratedPower = equipment.specifications?.ratings?.power || 2500;
        const isDay = hour >= 6 && hour <= 18;

        let solarIrradiance = 0;
        let activePower = 0;
        let efficiency = 0;

        if (isDay) {
            // Realistic solar irradiance curve
            const solarHour = hour + minute / 60;
            const noonFactor = Math.sin(Math.PI * (solarHour - 6) / 12);

            // Base irradiance with weather variation
            const baseIrradiance = 1000 * Math.max(0, noonFactor);
            const weatherFactor = 0.7 + Math.random() * 0.6; // 70-130% of clear sky
            const cloudiness = Math.sin(timestamp.getTime() / 600000) * 0.3; // 10-minute cloud cycles

            solarIrradiance = Math.max(0, baseIrradiance * weatherFactor * (1 + cloudiness) * this.config.seasonalFactor);

            // Power output based on irradiance with panel efficiency
            const panelEfficiency = 0.18 + Math.random() * 0.04; // 18-22% efficiency
            const temperatureFactor = this.getTemperatureFactor(hour);

            activePower = Math.max(0, (solarIrradiance / 1000) * ratedPower * panelEfficiency * temperatureFactor);
            efficiency = solarIrradiance > 100 ? (panelEfficiency * 100 * temperatureFactor) : 0;
        }

        // Add equipment degradation and maintenance effects
        const equipmentFactor = this.getEquipmentFactor(equipment);
        activePower *= equipmentFactor;
        efficiency *= equipmentFactor;

        return {
            electrical: {
                activePower: Math.round(activePower * 10) / 10,
                reactivePower: Math.round(activePower * 0.1 * 10) / 10,
                voltage: {
                    l1: 690 + (Math.random() - 0.5) * 20,
                    l2: 690 + (Math.random() - 0.5) * 20,
                    l3: 690 + (Math.random() - 0.5) * 20
                },
                current: {
                    l1: activePower > 0 ? activePower / 690 + (Math.random() - 0.5) * 2 : 0,
                    l2: activePower > 0 ? activePower / 690 + (Math.random() - 0.5) * 2 : 0,
                    l3: activePower > 0 ? activePower / 690 + (Math.random() - 0.5) * 2 : 0
                },
                frequency: 50 + (Math.random() - 0.5) * 0.2,
                energy: {
                    totalGeneration: this.getCumulativeEnergy(equipment._id, activePower)
                }
            },
            environmental: {
                weather: {
                    solarIrradiance: Math.round(solarIrradiance),
                    temperature: {
                        ambient: this.getAmbientTemperature(hour),
                        module: isDay ? this.getAmbientTemperature(hour) + 15 + solarIrradiance / 50 : this.getAmbientTemperature(hour)
                    },
                    humidity: 40 + Math.random() * 40,
                    windSpeed: 2 + Math.random() * 8,
                    cloudCover: Math.max(0, Math.min(100, 50 + Math.sin(timestamp.getTime() / 900000) * 30))
                }
            },
            performance: {
                efficiency: Math.round(efficiency * 100) / 100,
                availability: this.getAvailability(equipment),
                capacityFactor: activePower > 0 ? Math.round((activePower / ratedPower * 100) * 100) / 100 : 0
            }
        };
    }

    /**
     * Generate wind-specific reading with realistic patterns
     */
    generateWindReading(equipment, timestamp, hour, minute) {
        const ratedPower = equipment.specifications?.ratings?.power || 2200;

        // Wind speed with daily and seasonal patterns
        const baseWindSpeed = 8 + Math.sin(hour * Math.PI / 12) * 3; // Daily wind pattern
        const gustiness = Math.sin(timestamp.getTime() / 300000) * 2; // 5-minute gusts
        const seasonalWind = this.config.seasonalFactor * 0.5 + 0.75; // Seasonal variation

        const windSpeed = Math.max(0, baseWindSpeed + gustiness + (Math.random() - 0.5) * 4) * seasonalWind;

        // Wind power curve simulation
        let activePower = 0;
        const cutInSpeed = 3;
        const ratedSpeed = 12;
        const cutOutSpeed = 25;

        if (windSpeed >= cutInSpeed && windSpeed <= cutOutSpeed) {
            if (windSpeed <= ratedSpeed) {
                // Cubic relationship below rated speed
                activePower = ratedPower * Math.pow(windSpeed / ratedSpeed, 3);
            } else {
                // Rated power above rated wind speed
                activePower = ratedPower * (0.95 + Math.random() * 0.1);
            }
        }

        // Equipment factor
        const equipmentFactor = this.getEquipmentFactor(equipment);
        activePower *= equipmentFactor;

        const efficiency = windSpeed > cutInSpeed ? (88 + Math.random() * 8) * equipmentFactor : 0;

        return {
            electrical: {
                activePower: Math.round(activePower * 10) / 10,
                reactivePower: Math.round(activePower * 0.05 * 10) / 10,
                voltage: {
                    l1: 690 + (Math.random() - 0.5) * 20,
                    l2: 690 + (Math.random() - 0.5) * 20,
                    l3: 690 + (Math.random() - 0.5) * 20
                },
                frequency: 50 + (Math.random() - 0.5) * 0.1,
                energy: {
                    totalGeneration: this.getCumulativeEnergy(equipment._id, activePower)
                }
            },
            environmental: {
                weather: {
                    windSpeed: Math.round(windSpeed * 10) / 10,
                    windDirection: (timestamp.getTime() / 60000 + Math.random() * 10) % 360,
                    temperature: {
                        ambient: this.getAmbientTemperature(hour),
                        nacelle: this.getAmbientTemperature(hour) + 5 + activePower / 1000
                    },
                    humidity: 50 + Math.random() * 30,
                    pressure: 1013 + (Math.random() - 0.5) * 20
                }
            },
            mechanical: {
                rotation: {
                    speed: windSpeed > cutInSpeed ? 15 + windSpeed * 0.8 + Math.random() * 5 : 0,
                    torque: activePower > 0 ? (activePower * 1000) / (15 + windSpeed * 0.8) : 0
                },
                vibration: {
                    bearing1: {
                        x: Math.random() * 2,
                        y: Math.random() * 2,
                        z: Math.random() * 2
                    }
                }
            },
            performance: {
                efficiency: Math.round(efficiency * 100) / 100,
                availability: this.getAvailability(equipment),
                capacityFactor: activePower > 0 ? Math.round((activePower / ratedPower * 100) * 100) / 100 : 0
            }
        };
    }

    /**
     * Generate hydro-specific reading with realistic patterns
     */
    generateHydroReading(equipment, timestamp, hour, minute) {
        const ratedPower = equipment.specifications?.ratings?.power || 100000;

        // Hydro plants have more stable output with seasonal variations
        const baseFlow = 50 + Math.sin((timestamp.getMonth() + 1) * Math.PI / 6) * 20; // Seasonal flow
        const dailyVariation = Math.sin(hour * Math.PI / 12) * 5; // Daily demand variation
        const waterFlow = Math.max(20, baseFlow + dailyVariation + (Math.random() - 0.5) * 10);

        const head = 45 + Math.random() * 10; // Reservoir level variation
        const efficiency = 0.85 + Math.random() * 0.1;

        // Power calculation: P = ρ * g * Q * H * η (simplified)
        const theoreticalPower = waterFlow * head * 9.81 * efficiency / 1000;
        const activePower = Math.min(ratedPower, theoreticalPower) * this.getEquipmentFactor(equipment);

        return {
            electrical: {
                activePower: Math.round(activePower * 10) / 10,
                reactivePower: Math.round(activePower * 0.02 * 10) / 10,
                voltage: {
                    l1: 11000 + (Math.random() - 0.5) * 200,
                    l2: 11000 + (Math.random() - 0.5) * 200,
                    l3: 11000 + (Math.random() - 0.5) * 200
                },
                frequency: 50 + (Math.random() - 0.5) * 0.05,
                energy: {
                    totalGeneration: this.getCumulativeEnergy(equipment._id, activePower)
                }
            },
            environmental: {
                water: {
                    level: {
                        reservoir: head + 2,
                        tailrace: 2 + Math.random() * 1
                    },
                    flow: {
                        inflow: waterFlow + (Math.random() - 0.5) * 5,
                        outflow: waterFlow,
                        turbine: waterFlow * 0.95
                    },
                    quality: {
                        turbidity: 5 + Math.random() * 10,
                        ph: 7 + Math.random() * 1,
                        temperature: 15 + Math.random() * 10
                    }
                }
            },
            mechanical: {
                rotation: {
                    speed: 150 + Math.random() * 20,
                    torque: activePower > 0 ? (activePower * 1000) / (150 + Math.random() * 20) : 0
                }
            },
            performance: {
                efficiency: Math.round(efficiency * 100 * 100) / 100,
                availability: this.getAvailability(equipment),
                capacityFactor: Math.round((activePower / ratedPower * 100) * 100) / 100
            }
        };
    }

    /**
     * Generate generic reading for unknown equipment types
     */
    generateGenericReading(equipment, timestamp) {
        const ratedPower = equipment.specifications?.ratings?.power || 1000;
        const activePower = ratedPower * (0.7 + Math.random() * 0.3) * this.getEquipmentFactor(equipment);

        return {
            electrical: {
                activePower: Math.round(activePower * 10) / 10,
                reactivePower: Math.round(activePower * 0.1 * 10) / 10,
                voltage: {
                    l1: 400 + (Math.random() - 0.5) * 20,
                    l2: 400 + (Math.random() - 0.5) * 20,
                    l3: 400 + (Math.random() - 0.5) * 20
                },
                frequency: 50 + (Math.random() - 0.5) * 0.1,
                energy: {
                    totalGeneration: this.getCumulativeEnergy(equipment._id, activePower)
                }
            },
            performance: {
                efficiency: Math.round((85 + Math.random() * 10) * 100) / 100,
                availability: this.getAvailability(equipment),
                capacityFactor: Math.round((activePower / ratedPower * 100) * 100) / 100
            }
        };
    }

    // Helper methods
    getSeasonalFactor() {
        const month = new Date().getMonth() + 1;
        // Summer months have higher solar potential, winter months have higher wind
        return 0.8 + 0.4 * Math.sin((month - 3) * Math.PI / 6);
    }

    getTemperatureFactor(hour) {
        // Solar panels lose efficiency as temperature increases
        const temp = this.getAmbientTemperature(hour);
        return Math.max(0.7, 1 - (temp - 25) * 0.004); // -0.4% per degree above 25°C
    }

    getAmbientTemperature(hour) {
        // Daily temperature curve
        const dailyTemp = 25 + 10 * Math.sin((hour - 6) * Math.PI / 12);
        return dailyTemp + (Math.random() - 0.5) * 5;
    }

    getEquipmentFactor(equipment) {
        // Simulate equipment degradation and maintenance
        const status = equipment.performance?.currentStatus;
        const baseEfficiency = status === 'Maintenance' ? 0.5 : 1.0;

        // Random equipment variations
        const randomFactor = 0.95 + Math.random() * 0.1;

        // Simulate occasional equipment issues
        const faultChance = Math.random();
        if (faultChance < this.config.equipmentFailureRate) {
            return baseEfficiency * 0.3; // Significant reduction during faults
        }

        return baseEfficiency * randomFactor;
    }

    getAvailability(equipment) {
        const status = equipment.performance?.currentStatus;
        const baseAvailability = status === 'Operational' ? 98 : 85;
        return baseAvailability + Math.random() * 2;
    }

    getCumulativeEnergy(equipmentId, currentPower) {
        // Simulate cumulative energy generation
        // In a real system, this would be stored and incremented
        const hoursRunning = (Date.now() - this.simulationStartTime?.getTime() || 0) / 3600000;
        const avgPower = currentPower * 0.7; // Assume 70% average capacity
        return Math.round(avgPower * hoursRunning * 100) / 100;
    }
}

module.exports = LiveDataSimulator;
