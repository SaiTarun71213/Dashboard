const mongoose = require('mongoose');

/**
 * EQUIPMENT MODEL
 * Represents individual equipment units (Solar Panels, Wind Turbines, Hydro Generators)
 * Based on SCADA and real-time monitoring systems
 */
const equipmentSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Equipment name is required'],
        trim: true
    },

    equipmentId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    type: {
        type: String,
        required: true,
        enum: ['Solar Panel', 'Solar Inverter', 'Wind Turbine', 'Hydro Turbine', 'Generator', 'Transformer', 'Switchgear']
    },

    // Plant Reference
    plant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant',
        required: true
    },

    // Equipment Specifications
    specifications: {
        manufacturer: { type: String, required: true },
        model: { type: String, required: true },
        serialNumber: { type: String, required: true, unique: true },
        yearOfManufacture: Number,

        // Technical Ratings
        ratings: {
            power: Number, // kW or MW
            voltage: Number, // V
            current: Number, // A
            frequency: Number, // Hz
            efficiency: Number, // %
            powerFactor: Number
        },

        // Physical Dimensions
        dimensions: {
            length: Number, // meters
            width: Number, // meters
            height: Number, // meters
            weight: Number, // kg
            area: Number // m² (for solar panels)
        },

        // Operating Conditions
        operatingConditions: {
            temperatureRange: {
                min: Number, // °C
                max: Number, // °C
                optimal: Number // °C
            },
            humidityRange: {
                min: Number, // %
                max: Number // %
            },
            altitudeLimit: Number, // meters
            ipRating: String, // IP65, IP67 etc.
            windLoadRating: Number // N/m²
        }
    },

    // Installation Details
    installation: {
        installationDate: Date,
        commissioningDate: Date,
        installedBy: String,

        location: {
            coordinates: {
                latitude: Number,
                longitude: Number
            },
            block: String,
            row: String,
            position: String,
            orientation: {
                azimuth: Number, // degrees
                tilt: Number // degrees
            }
        },

        connections: {
            dcCabling: String,
            acCabling: String,
            earthing: String,
            communicationCable: String
        }
    },

    // Warranty & Maintenance
    warranty: {
        manufacturer: {
            duration: Number, // years
            startDate: Date,
            endDate: Date,
            terms: String
        },
        performance: {
            duration: Number, // years
            guaranteedOutput: Number, // %
            degradationLimit: Number // % per year
        }
    },

    maintenance: {
        schedule: {
            daily: [String],
            weekly: [String],
            monthly: [String],
            quarterly: [String],
            annual: [String]
        },

        lastMaintenance: {
            date: Date,
            type: {
                type: String,
                enum: ['Preventive', 'Corrective', 'Predictive', 'Emergency']
            },
            performedBy: String,
            findings: String,
            actions: [String]
        },

        nextMaintenance: {
            date: Date,
            type: String
        }
    },

    // Performance Metrics
    performance: {
        currentStatus: {
            type: String,
            enum: ['Online', 'Offline', 'Maintenance', 'Fault', 'Standby'],
            default: 'Online'
        },

        availability: Number, // %
        reliability: Number, // %

        // Cumulative Data
        totalEnergyGenerated: Number, // kWh
        totalOperatingHours: Number,
        totalStartStops: Number,

        // Efficiency Metrics
        currentEfficiency: Number, // %
        averageEfficiency: Number, // %
        peakEfficiency: Number, // %

        // Performance Ratios
        performanceRatio: Number, // %
        capacityFactor: Number, // %

        // Degradation
        degradationRate: Number, // % per year
        expectedLife: Number // years
    },

    // Fault & Alarm History
    faults: [{
        faultCode: String,
        faultType: {
            type: String,
            enum: ['Critical', 'Major', 'Minor', 'Warning']
        },
        description: String,
        occurredAt: { type: Date, default: Date.now },
        resolvedAt: Date,
        downtime: Number, // hours
        rootCause: String,
        correctiveAction: String,
        preventiveAction: String,
        cost: Number // INR
    }],

    // Communication & Control
    communication: {
        protocol: {
            type: String,
            enum: ['Modbus RTU', 'Modbus TCP', 'DNP3', 'IEC 61850', 'MQTT', 'HTTP/HTTPS']
        },
        ipAddress: String,
        port: Number,
        slaveId: Number,
        communicationStatus: {
            type: String,
            enum: ['Connected', 'Disconnected', 'Error'],
            default: 'Connected'
        },
        lastCommunication: Date,
        dataUpdateInterval: Number // seconds
    },

    // Safety & Protection
    safety: {
        protectionSystems: [{
            type: {
                type: String,
                enum: ['Overcurrent', 'Overvoltage', 'Undervoltage', 'Earth Fault', 'Temperature', 'Vibration']
            },
            setPoint: Number,
            status: {
                type: String,
                enum: ['Active', 'Inactive', 'Bypassed']
            }
        }],

        safetyDevices: [{
            name: String,
            type: String,
            status: String,
            lastTested: Date,
            nextTest: Date
        }],

        lockoutTagout: {
            isLocked: { type: Boolean, default: false },
            lockedBy: String,
            lockedAt: Date,
            reason: String
        }
    },

    // Environmental Monitoring
    environmental: {
        operatingTemperature: Number, // °C
        ambientTemperature: Number, // °C
        humidity: Number, // %
        vibration: {
            x: Number, // mm/s
            y: Number, // mm/s
            z: Number // mm/s
        },
        noise: Number, // dB
        dustLevel: Number // mg/m³
    },

    // Financial Data
    financial: {
        purchaseCost: Number, // INR
        installationCost: Number, // INR
        maintenanceCost: Number, // INR per year
        replacementCost: Number, // INR
        salvageValue: Number, // INR

        insurance: {
            provider: String,
            policyNumber: String,
            coverage: Number, // INR
            premium: Number, // INR per year
            validTill: Date
        }
    },

    // Status & Metadata
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: true },

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for uptime percentage
equipmentSchema.virtual('uptimePercentage').get(function () {
    const totalHours = (Date.now() - this.installation.commissioningDate) / (1000 * 60 * 60);
    if (totalHours === 0) return 0;
    return ((totalHours - this.getTotalDowntime()) / totalHours * 100).toFixed(2);
});

// Method to calculate total downtime
equipmentSchema.methods.getTotalDowntime = function () {
    if (!this.faults || !Array.isArray(this.faults)) {
        return 0;
    }
    return this.faults.reduce((total, fault) => {
        return total + (fault.downtime || 0);
    }, 0);
};

// Indexes for performance
equipmentSchema.index({ equipmentId: 1 });
equipmentSchema.index({ plant: 1 });
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ 'performance.currentStatus': 1 });
equipmentSchema.index({ 'communication.communicationStatus': 1 });
equipmentSchema.index({ serialNumber: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
