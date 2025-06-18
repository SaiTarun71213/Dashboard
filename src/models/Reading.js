const mongoose = require('mongoose');

/**
 * READING MODEL
 * Stores real-time SCADA data from equipment
 * Optimized for high-frequency data insertion and time-series queries
 */
const readingSchema = new mongoose.Schema({
    // Equipment Reference
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },

    plant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant',
        required: true
    },

    // Timestamp
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },

    // Electrical Parameters
    electrical: {
        // Power Measurements
        activePower: Number, // kW
        reactivePower: Number, // kVAR
        apparentPower: Number, // kVA
        powerFactor: Number,

        // Voltage Measurements (3-phase)
        voltage: {
            l1: Number, // V (Line 1)
            l2: Number, // V (Line 2)
            l3: Number, // V (Line 3)
            average: Number, // V
            lineToLine: {
                l1l2: Number, // V
                l2l3: Number, // V
                l3l1: Number // V
            }
        },

        // Current Measurements (3-phase)
        current: {
            l1: Number, // A (Line 1)
            l2: Number, // A (Line 2)
            l3: Number, // A (Line 3)
            average: Number, // A
            neutral: Number // A
        },

        // Frequency
        frequency: Number, // Hz

        // Energy Measurements
        energy: {
            activeImport: Number, // kWh
            activeExport: Number, // kWh
            reactiveImport: Number, // kVARh
            reactiveExport: Number, // kVARh
            totalGeneration: Number // kWh (cumulative)
        },

        // Power Quality
        powerQuality: {
            thd: { // Total Harmonic Distortion
                voltage: Number, // %
                current: Number // %
            },
            unbalance: {
                voltage: Number, // %
                current: Number // %
            },
            flicker: Number, // %
            sag: Number, // count
            swell: Number // count
        }
    },

    // Environmental Parameters
    environmental: {
        // Weather Data
        weather: {
            solarIrradiance: Number, // W/m²
            globalHorizontalIrradiance: Number, // W/m²
            directNormalIrradiance: Number, // W/m²
            diffuseHorizontalIrradiance: Number, // W/m²

            windSpeed: Number, // m/s
            windDirection: Number, // degrees
            windGust: Number, // m/s

            temperature: {
                ambient: Number, // °C
                module: Number, // °C (for solar)
                nacelle: Number, // °C (for wind)
                gearbox: Number, // °C (for wind)
                generator: Number // °C
            },

            humidity: Number, // %
            pressure: Number, // hPa
            rainfall: Number, // mm
            snowfall: Number, // mm

            visibility: Number, // km
            uvIndex: Number,
            cloudCover: Number // %
        },

        // Water Parameters (for Hydro)
        water: {
            level: {
                reservoir: Number, // meters
                tailrace: Number, // meters
                forebay: Number // meters
            },
            flow: {
                inflow: Number, // cumecs
                outflow: Number, // cumecs
                spillway: Number, // cumecs
                turbine: Number // cumecs
            },
            quality: {
                turbidity: Number, // NTU
                ph: Number,
                temperature: Number, // °C
                dissolvedOxygen: Number // mg/L
            }
        }
    },

    // Mechanical Parameters
    mechanical: {
        // Vibration (for rotating equipment)
        vibration: {
            bearing1: {
                x: Number, // mm/s
                y: Number, // mm/s
                z: Number // mm/s
            },
            bearing2: {
                x: Number, // mm/s
                y: Number, // mm/s
                z: Number // mm/s
            },
            gearbox: {
                x: Number, // mm/s
                y: Number, // mm/s
                z: Number // mm/s
            }
        },

        // Rotational Parameters
        rotation: {
            speed: Number, // RPM
            torque: Number, // Nm
            thrust: Number // N (for wind turbines)
        },

        // Lubrication System
        lubrication: {
            oilPressure: Number, // bar
            oilTemperature: Number, // °C
            oilLevel: Number, // %
            filterPressureDrop: Number // bar
        },

        // Cooling System
        cooling: {
            coolantTemperature: Number, // °C
            coolantPressure: Number, // bar
            coolantFlow: Number, // L/min
            fanSpeed: Number // RPM
        }
    },

    // Control System Parameters
    control: {
        // Operating Mode
        operatingMode: {
            type: String,
            enum: ['Automatic', 'Manual', 'Remote', 'Local', 'Test', 'Maintenance']
        },

        // Setpoints
        setpoints: {
            powerReference: Number, // kW
            voltageReference: Number, // V
            frequencyReference: Number, // Hz
            temperatureLimit: Number // °C
        },

        // Control Signals
        signals: {
            start: Boolean,
            stop: Boolean,
            reset: Boolean,
            emergency: Boolean,
            maintenance: Boolean
        },

        // Protection Status
        protection: {
            overcurrent: Boolean,
            overvoltage: Boolean,
            undervoltage: Boolean,
            overfrequency: Boolean,
            underfrequency: Boolean,
            earthFault: Boolean,
            overtemperature: Boolean,
            vibrationHigh: Boolean
        }
    },

    // Performance Metrics
    performance: {
        efficiency: Number, // %
        availability: Number, // %
        performanceRatio: Number, // %
        capacityFactor: Number, // %

        // Specific Yield (for solar)
        specificYield: Number, // kWh/kWp

        // Wind Turbine Specific
        windTurbine: {
            powerCurveDeviation: Number, // %
            wakeEffect: Number, // %
            yawError: Number, // degrees
            pitchAngle: {
                blade1: Number, // degrees
                blade2: Number, // degrees
                blade3: Number // degrees
            }
        }
    },

    // Alarms & Events
    alarms: [{
        code: String,
        severity: {
            type: String,
            enum: ['Critical', 'Major', 'Minor', 'Warning', 'Info']
        },
        description: String,
        active: Boolean,
        acknowledgedBy: String,
        acknowledgedAt: Date
    }],

    // Data Quality
    dataQuality: {
        source: {
            type: String,
            enum: ['SCADA', 'SCADA_SIM', 'Manual', 'Estimated', 'Calculated'],
            default: 'SCADA'
        },
        confidence: Number, // % (0-100)
        validated: Boolean,
        interpolated: Boolean,

        // Communication Status
        communication: {
            latency: Number, // ms
            packetLoss: Number, // %
            signalStrength: Number // dBm
        }
    },

    // Metadata
    metadata: {
        recordType: {
            type: String,
            enum: ['Real-time', 'Historical', 'Aggregated', 'Calculated'],
            default: 'Real-time'
        },
        aggregationPeriod: Number, // minutes
        dataVersion: { type: Number, default: 1 },
        tags: [String]
    }
}, {
    timestamps: false, // We use our own timestamp field
    // Optimize for time-series data
    timeseries: {
        timeField: 'timestamp',
        metaField: 'equipment',
        granularity: 'minutes'
    }
});

// Compound indexes for time-series queries
readingSchema.index({ equipment: 1, timestamp: -1 });
readingSchema.index({ plant: 1, timestamp: -1 });
readingSchema.index({ timestamp: -1 });
readingSchema.index({ 'electrical.activePower': 1 });
readingSchema.index({ 'environmental.weather.solarIrradiance': 1 });
readingSchema.index({ 'environmental.weather.windSpeed': 1 });

// TTL index for automatic data cleanup (optional - keep 2 years of data)
readingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to get latest reading for equipment
readingSchema.statics.getLatestReading = function (equipmentId) {
    return this.findOne({ equipment: equipmentId }).sort({ timestamp: -1 });
};

// Static method to get readings in time range
readingSchema.statics.getReadingsInRange = function (equipmentId, startTime, endTime) {
    return this.find({
        equipment: equipmentId,
        timestamp: { $gte: startTime, $lte: endTime }
    }).sort({ timestamp: 1 });
};

module.exports = mongoose.model('Reading', readingSchema);
