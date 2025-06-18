const mongoose = require('mongoose');

/**
 * PLANT MODEL
 * Represents energy generation plants (Solar/Wind/Hydro)
 * Based on real-world power plant monitoring systems
 */
const plantSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Plant name is required'],
        trim: true,
        maxlength: 200
    },

    plantId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    type: {
        type: String,
        required: true,
        enum: ['Solar', 'Wind', 'Hydro', 'Hybrid']
    },

    subType: {
        type: String,
        enum: {
            values: [
                // Solar subtypes
                'Utility Scale Solar', 'Rooftop Solar', 'Floating Solar', 'Agri-Solar',
                // Wind subtypes  
                'Onshore Wind', 'Offshore Wind',
                // Hydro subtypes
                'Run-of-River', 'Reservoir', 'Pumped Storage', 'Small Hydro'
            ]
        }
    },

    // Location & Geography
    location: {
        state: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: true
        },
        district: { type: String, required: true },
        taluka: { type: String },
        village: { type: String },

        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            elevation: { type: Number } // meters above sea level
        },

        address: {
            street: String,
            pincode: { type: String, match: /^[0-9]{6}$/ },
            nearestCity: String,
            distanceFromCity: Number // km
        }
    },

    // Technical Specifications
    technical: {
        capacity: {
            installed: { type: Number, required: true }, // MW
            operational: { type: Number, required: true }, // MW
            peak: { type: Number }, // MW
            nameplate: { type: Number } // MW
        },

        // Solar-specific parameters
        solar: {
            panelType: {
                type: String,
                enum: ['Monocrystalline', 'Polycrystalline', 'Thin Film', 'Bifacial']
            },
            panelCount: Number,
            panelCapacity: Number, // Wp per panel
            inverterType: {
                type: String,
                enum: ['String Inverter', 'Central Inverter', 'Power Optimizer', 'Microinverter']
            },
            inverterCount: Number,
            trackingSystem: {
                type: String,
                enum: ['Fixed Tilt', 'Single Axis', 'Dual Axis']
            },
            tiltAngle: Number, // degrees
            azimuthAngle: Number, // degrees
            landArea: Number, // acres
            dcAcRatio: Number,
            moduleEfficiency: Number, // %
            systemEfficiency: Number, // %
            degradationRate: Number // % per year
        },

        // Wind-specific parameters
        wind: {
            turbineModel: String,
            turbineCount: Number,
            turbineCapacity: Number, // MW per turbine
            hubHeight: Number, // meters
            rotorDiameter: Number, // meters
            sweptArea: Number, // m²
            cutInSpeed: Number, // m/s
            ratedSpeed: Number, // m/s
            cutOutSpeed: Number, // m/s
            powerCurve: [{
                windSpeed: Number, // m/s
                power: Number // kW
            }],
            turbineSpacing: Number, // meters
            accessRoadLength: Number, // km
            transmissionLineLength: Number // km
        },

        // Hydro-specific parameters
        hydro: {
            damHeight: Number, // meters
            damLength: Number, // meters
            reservoirCapacity: Number, // MCM (Million Cubic Meters)
            catchmentArea: Number, // sq km
            turbineType: {
                type: String,
                enum: ['Francis', 'Kaplan', 'Pelton', 'Turgo', 'Cross-flow']
            },
            turbineCount: Number,
            turbineCapacity: Number, // MW per turbine
            head: Number, // meters (gross head)
            designDischarge: Number, // cumecs
            spillwayCapacity: Number, // cumecs
            powerhouse: {
                length: Number, // meters
                width: Number, // meters
                height: Number // meters
            }
        }
    },

    // Financial Information
    financial: {
        projectCost: Number, // Crores INR
        debtEquityRatio: Number,
        tariff: Number, // INR per kWh
        ppa: { // Power Purchase Agreement
            buyer: String,
            duration: Number, // years
            startDate: Date,
            endDate: Date,
            escalation: Number // % per year
        },
        capex: Number, // INR per MW
        opex: Number, // INR per MW per year
        lcoe: Number, // Levelized Cost of Energy (INR per kWh)
        irr: Number, // Internal Rate of Return %
        paybackPeriod: Number // years
    },

    // Operational Data
    operational: {
        commissioningDate: Date,
        commercialOperationDate: Date,
        expectedLife: { type: Number, default: 25 }, // years

        performance: {
            plantLoadFactor: Number, // %
            capacityUtilizationFactor: Number, // %
            availability: Number, // %
            energyYield: Number, // kWh/kWp (for solar)
            performanceRatio: Number // %
        },

        maintenance: {
            lastMajorMaintenance: Date,
            nextScheduledMaintenance: Date,
            maintenanceContract: String,
            warrantyExpiry: Date
        },

        grid: {
            connectionVoltage: Number, // kV
            substationName: String,
            transmissionLosses: Number, // %
            gridCode: String,
            meteringPoint: String
        }
    },

    // Environmental Data
    environmental: {
        environmentalClearance: {
            number: String,
            issuedBy: String,
            validTill: Date
        },

        impact: {
            co2Avoided: Number, // tonnes per year
            waterSaved: Number, // liters per year
            treesEquivalent: Number,
            coalEquivalent: Number // tonnes per year
        },

        monitoring: {
            airQuality: Boolean,
            noiseLevel: Boolean,
            waterQuality: Boolean,
            soilQuality: Boolean,
            biodiversity: Boolean
        }
    },

    // Stakeholders
    stakeholders: {
        developer: {
            name: String,
            type: {
                type: String,
                enum: ['Private', 'Government', 'Joint Venture', 'Foreign']
            },
            contact: {
                email: String,
                phone: String,
                address: String
            }
        },

        operator: {
            name: String,
            contract: {
                startDate: Date,
                duration: Number // years
            }
        },

        epc: { // Engineering, Procurement, Construction
            contractor: String,
            completionDate: Date,
            warrantyPeriod: Number // years
        }
    },

    // Compliance & Certifications
    compliance: {
        licenses: [{
            type: String,
            number: String,
            issuedBy: String,
            validFrom: Date,
            validTill: Date
        }],

        certifications: [{
            name: String,
            issuedBy: String,
            validTill: Date
        }],

        inspections: [{
            type: String,
            date: Date,
            inspector: String,
            status: {
                type: String,
                enum: ['Passed', 'Failed', 'Conditional']
            },
            remarks: String
        }]
    },

    // Status & Metadata
    status: {
        type: String,
        enum: ['Planning', 'Under Construction', 'Commissioned', 'Operational', 'Maintenance', 'Decommissioned'],
        default: 'Planning'
    },

    isActive: { type: Boolean, default: true },

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

// Virtual for equipment count
plantSchema.virtual('equipmentCount', {
    ref: 'Equipment',
    localField: '_id',
    foreignField: 'plant',
    count: true
});

// Virtual for capacity utilization
plantSchema.virtual('capacityUtilization').get(function () {
    if (!this.technical.capacity.installed) return 0;
    return (this.technical.capacity.operational / this.technical.capacity.installed * 100).toFixed(2);
});

// Indexes
plantSchema.index({ plantId: 1 });
plantSchema.index({ type: 1 });
plantSchema.index({ 'location.state': 1 });
plantSchema.index({ 'technical.capacity.installed': -1 });
plantSchema.index({ status: 1 });
plantSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index

// Pre-save middleware to generate plantId
plantSchema.pre('save', function (next) {
    if (!this.plantId) {
        const stateCode = this.location.state.toString().slice(-3).toUpperCase();
        const typeCode = this.type.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.plantId = `${stateCode}-${typeCode}-${timestamp}`;
    }
    next();
});

module.exports = mongoose.model('Plant', plantSchema);
