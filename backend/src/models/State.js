const mongoose = require('mongoose');

/**
 * STATE MODEL
 * Represents Indian states with comprehensive energy sector information
 * Based on real Indian energy infrastructure data
 */
const stateSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'State name is required'],
        unique: true,
        trim: true,
        enum: [
            'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 
            'Maharashtra', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh'
        ]
    },
    
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 2,
        maxlength: 3
    },
    
    // Geographic Information
    geography: {
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        area: {
            total: { type: Number, required: true }, // in sq km
            coastal: { type: Number, default: 0 },
            desert: { type: Number, default: 0 },
            forest: { type: Number, default: 0 }
        },
        climate: {
            type: String,
            enum: ['Tropical', 'Subtropical', 'Arid', 'Semi-Arid', 'Temperate'],
            required: true
        },
        averageTemperature: {
            summer: { type: Number }, // Celsius
            winter: { type: Number },
            monsoon: { type: Number }
        },
        rainfall: {
            annual: { type: Number }, // mm
            monsoon: { type: Number }
        }
    },
    
    // Energy Infrastructure
    energyProfile: {
        totalCapacity: { type: Number, default: 0 }, // MW
        renewableCapacity: { type: Number, default: 0 }, // MW
        conventionalCapacity: { type: Number, default: 0 }, // MW
        
        capacityBySource: {
            solar: { type: Number, default: 0 }, // MW
            wind: { type: Number, default: 0 }, // MW
            hydro: { type: Number, default: 0 }, // MW
            thermal: { type: Number, default: 0 }, // MW
            nuclear: { type: Number, default: 0 } // MW
        },
        
        energyDemand: {
            peak: { type: Number }, // MW
            average: { type: Number }, // MW
            industrial: { type: Number }, // MW
            domestic: { type: Number }, // MW
            commercial: { type: Number }, // MW
            agricultural: { type: Number } // MW
        },
        
        transmissionLines: {
            total: { type: Number, default: 0 }, // km
            voltage400kv: { type: Number, default: 0 },
            voltage220kv: { type: Number, default: 0 },
            voltage132kv: { type: Number, default: 0 }
        }
    },
    
    // Economic Data
    economics: {
        gdp: { type: Number }, // Crores INR
        perCapitaIncome: { type: Number }, // INR
        industrialContribution: { type: Number }, // % of GDP
        energyIntensity: { type: Number }, // kWh per INR of GDP
        electricityTariff: {
            domestic: { type: Number }, // INR per kWh
            industrial: { type: Number },
            commercial: { type: Number },
            agricultural: { type: Number }
        }
    },
    
    // Renewable Energy Potential
    renewablePotential: {
        solar: {
            technical: { type: Number }, // MW
            economic: { type: Number }, // MW
            solarIrradiation: { type: Number }, // kWh/m²/day
            suitableLand: { type: Number } // sq km
        },
        wind: {
            technical: { type: Number }, // MW
            economic: { type: Number }, // MW
            averageWindSpeed: { type: Number }, // m/s
            windyDays: { type: Number } // days per year
        },
        hydro: {
            technical: { type: Number }, // MW
            economic: { type: Number }, // MW
            majorRivers: [String],
            reservoirCapacity: { type: Number } // MCM
        }
    },
    
    // Government & Policy
    governance: {
        chiefMinister: { type: String },
        energyMinister: { type: String },
        electricityBoard: { type: String },
        regulatoryCommission: { type: String },
        
        policies: [{
            name: String,
            type: {
                type: String,
                enum: ['Solar Policy', 'Wind Policy', 'Renewable Policy', 'Energy Policy']
            },
            year: Number,
            targets: {
                capacity: Number, // MW
                timeline: Date
            },
            incentives: [String]
        }]
    },
    
    // Demographics
    demographics: {
        population: { type: Number },
        ruralPopulation: { type: Number },
        urbanPopulation: { type: Number },
        electrificationRate: {
            overall: { type: Number }, // %
            rural: { type: Number }, // %
            urban: { type: Number } // %
        },
        literacyRate: { type: Number } // %
    },
    
    // Infrastructure
    infrastructure: {
        roadLength: { type: Number }, // km
        railwayLength: { type: Number }, // km
        airports: { type: Number },
        ports: { type: Number },
        industrialParks: { type: Number },
        sez: { type: Number } // Special Economic Zones
    },
    
    // Status & Metadata
    status: {
        type: String,
        enum: ['Active', 'Planning', 'Under Development'],
        default: 'Active'
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
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total plants count
stateSchema.virtual('plantsCount', {
    ref: 'Plant',
    localField: '_id',
    foreignField: 'state',
    count: true
});

// Virtual for renewable percentage
stateSchema.virtual('renewablePercentage').get(function() {
    if (this.energyProfile.totalCapacity === 0) return 0;
    return (this.energyProfile.renewableCapacity / this.energyProfile.totalCapacity * 100).toFixed(2);
});

// Indexes for better query performance
stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });
stateSchema.index({ 'energyProfile.totalCapacity': -1 });
stateSchema.index({ 'renewablePotential.solar.technical': -1 });

module.exports = mongoose.model('State', stateSchema);
