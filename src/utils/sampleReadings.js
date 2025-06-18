const mongoose = require('mongoose');
const { Equipment, Reading } = require('../models');

/**
 * SAMPLE READINGS GENERATOR
 * Creates realistic time-series data for testing analytics
 */

class SampleReadingsGenerator {
    constructor() {
        this.equipment = [];
    }

    /**
     * Generate sample readings for all equipment
     */
    async generateSampleReadings() {
        try {
            console.log('📊 Generating sample readings...');

            // Get all equipment
            this.equipment = await Equipment.find({}).populate('plant', 'type');
            console.log(`Found ${this.equipment.length} equipment units`);

            // Generate readings for the last 7 days
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

            let totalReadings = 0;

            for (const equipment of this.equipment) {
                const readings = this.generateEquipmentReadings(equipment, startDate, endDate);
                
                // Insert in batches for performance
                const batchSize = 100;
                for (let i = 0; i < readings.length; i += batchSize) {
                    const batch = readings.slice(i, i + batchSize);
                    await Reading.insertMany(batch);
                    totalReadings += batch.length;
                }

                console.log(`✅ Generated ${readings.length} readings for ${equipment.name}`);
            }

            console.log(`🎉 Generated ${totalReadings} total readings`);

        } catch (error) {
            console.error('❌ Error generating sample readings:', error);
            throw error;
        }
    }

    /**
     * Generate readings for specific equipment
     */
    generateEquipmentReadings(equipment, startDate, endDate) {
        const readings = [];
        const plantType = equipment.plant.type;
        
        // Generate readings every 15 minutes
        const interval = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        for (let time = startDate.getTime(); time <= endDate.getTime(); time += interval) {
            const timestamp = new Date(time);
            const reading = this.generateSingleReading(equipment, timestamp, plantType);
            readings.push(reading);
        }

        return readings;
    }

    /**
     * Generate a single reading based on equipment type and time
     */
    generateSingleReading(equipment, timestamp, plantType) {
        const hour = timestamp.getHours();
        const isDay = hour >= 6 && hour <= 18;
        
        let reading = {
            equipment: equipment._id,
            plant: equipment.plant._id,
            timestamp,
            dataQuality: {
                source: 'SCADA',
                confidence: 95 + Math.random() * 5,
                validated: true
            }
        };

        // Generate data based on plant type
        switch (plantType) {
            case 'Solar':
                reading = { ...reading, ...this.generateSolarReading(equipment, timestamp, isDay) };
                break;
            case 'Wind':
                reading = { ...reading, ...this.generateWindReading(equipment, timestamp) };
                break;
            case 'Hydro':
                reading = { ...reading, ...this.generateHydroReading(equipment, timestamp) };
                break;
        }

        return reading;
    }

    /**
     * Generate solar-specific reading
     */
    generateSolarReading(equipment, timestamp, isDay) {
        const hour = timestamp.getHours();
        const ratedPower = equipment.specifications?.ratings?.power || 2500;
        
        // Solar irradiance pattern (0 at night, peak at noon)
        let solarIrradiance = 0;
        let activePower = 0;
        let efficiency = 0;
        
        if (isDay) {
            // Bell curve for solar irradiance
            const noonFactor = Math.sin(Math.PI * (hour - 6) / 12);
            solarIrradiance = Math.max(0, 800 * noonFactor + Math.random() * 200 - 100);
            
            // Power output based on irradiance
            activePower = Math.max(0, (solarIrradiance / 1000) * ratedPower * (0.85 + Math.random() * 0.1));
            efficiency = solarIrradiance > 100 ? 85 + Math.random() * 10 : 0;
        }

        return {
            electrical: {
                activePower: Math.round(activePower),
                reactivePower: Math.round(activePower * 0.1),
                voltage: {
                    l1: 690 + Math.random() * 20 - 10,
                    l2: 690 + Math.random() * 20 - 10,
                    l3: 690 + Math.random() * 20 - 10
                },
                current: {
                    l1: activePower > 0 ? activePower / 690 + Math.random() * 10 - 5 : 0,
                    l2: activePower > 0 ? activePower / 690 + Math.random() * 10 - 5 : 0,
                    l3: activePower > 0 ? activePower / 690 + Math.random() * 10 - 5 : 0
                },
                frequency: 50 + Math.random() * 0.2 - 0.1,
                energy: {
                    totalGeneration: Math.random() * 1000000 // Cumulative
                }
            },
            environmental: {
                weather: {
                    solarIrradiance: Math.round(solarIrradiance),
                    temperature: {
                        ambient: 25 + Math.random() * 15,
                        module: isDay ? 35 + Math.random() * 20 : 20 + Math.random() * 10
                    },
                    humidity: 40 + Math.random() * 30,
                    windSpeed: 2 + Math.random() * 8
                }
            },
            performance: {
                efficiency: Math.round(efficiency * 100) / 100,
                availability: 95 + Math.random() * 5,
                capacityFactor: activePower > 0 ? (activePower / ratedPower * 100) : 0
            }
        };
    }

    /**
     * Generate wind-specific reading
     */
    generateWindReading(equipment, timestamp) {
        const ratedPower = equipment.specifications?.ratings?.power || 2200;
        
        // Wind speed varies throughout the day
        const baseWindSpeed = 8 + Math.random() * 10; // 8-18 m/s
        const windSpeed = Math.max(0, baseWindSpeed + Math.sin(timestamp.getTime() / 3600000) * 3);
        
        // Power curve simulation (simplified)
        let activePower = 0;
        if (windSpeed >= 3 && windSpeed <= 25) { // Cut-in and cut-out speeds
            if (windSpeed <= 12) {
                // Cubic relationship below rated speed
                activePower = ratedPower * Math.pow(windSpeed / 12, 3);
            } else {
                // Rated power above rated wind speed
                activePower = ratedPower * (0.9 + Math.random() * 0.1);
            }
        }

        const efficiency = windSpeed > 3 ? 90 + Math.random() * 8 : 0;

        return {
            electrical: {
                activePower: Math.round(activePower),
                reactivePower: Math.round(activePower * 0.05),
                voltage: {
                    l1: 690 + Math.random() * 20 - 10,
                    l2: 690 + Math.random() * 20 - 10,
                    l3: 690 + Math.random() * 20 - 10
                },
                frequency: 50 + Math.random() * 0.1 - 0.05,
                energy: {
                    totalGeneration: Math.random() * 2000000 // Cumulative
                }
            },
            environmental: {
                weather: {
                    windSpeed: Math.round(windSpeed * 10) / 10,
                    windDirection: Math.random() * 360,
                    temperature: {
                        ambient: 20 + Math.random() * 15,
                        nacelle: 25 + Math.random() * 20
                    },
                    humidity: 50 + Math.random() * 30,
                    pressure: 1013 + Math.random() * 20 - 10
                }
            },
            mechanical: {
                rotation: {
                    speed: windSpeed > 3 ? 15 + Math.random() * 10 : 0,
                    torque: activePower > 0 ? activePower * 1000 / (15 + Math.random() * 10) : 0
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
                availability: 96 + Math.random() * 4,
                capacityFactor: activePower > 0 ? (activePower / ratedPower * 100) : 0
            }
        };
    }

    /**
     * Generate hydro-specific reading
     */
    generateHydroReading(equipment, timestamp) {
        const ratedPower = equipment.specifications?.ratings?.power || 100000; // 100 MW typical
        
        // Hydro plants have more stable output
        const waterFlow = 50 + Math.random() * 30; // cumecs
        const head = 45 + Math.random() * 10; // meters
        
        // Power calculation: P = ρ * g * Q * H * η
        const efficiency = 0.85 + Math.random() * 0.1;
        const activePower = Math.min(ratedPower, waterFlow * head * 9.81 * efficiency / 1000);

        return {
            electrical: {
                activePower: Math.round(activePower),
                reactivePower: Math.round(activePower * 0.02),
                voltage: {
                    l1: 11000 + Math.random() * 200 - 100,
                    l2: 11000 + Math.random() * 200 - 100,
                    l3: 11000 + Math.random() * 200 - 100
                },
                frequency: 50 + Math.random() * 0.05 - 0.025,
                energy: {
                    totalGeneration: Math.random() * 5000000 // Cumulative
                }
            },
            environmental: {
                water: {
                    level: {
                        reservoir: 45 + Math.random() * 5,
                        tailrace: 2 + Math.random() * 1
                    },
                    flow: {
                        inflow: waterFlow + Math.random() * 10 - 5,
                        outflow: waterFlow,
                        turbine: waterFlow * 0.9
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
                    speed: 150 + Math.random() * 20, // RPM
                    torque: activePower * 1000 / (150 + Math.random() * 20)
                }
            },
            performance: {
                efficiency: Math.round(efficiency * 100 * 100) / 100,
                availability: 98 + Math.random() * 2,
                capacityFactor: (activePower / ratedPower * 100)
            }
        };
    }
}

module.exports = SampleReadingsGenerator;
