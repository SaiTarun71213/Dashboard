# 🏗️ Energy Dashboard Database Schema

## 📊 Overview

This document provides a comprehensive overview of the database schema for the Energy Dashboard API, designed to handle real-world energy monitoring data across Solar, Wind, and Hydro power plants in 8 Indian states.

## 🎯 Database Architecture

### **Hierarchical Structure**
```
🇮🇳 COUNTRY (India)
├── 🏛️ STATES (8 Indian States)
│   ├── 🏭 PLANTS (Solar/Wind/Hydro)
│   │   ├── ⚡ EQUIPMENT (Panels/Turbines/Generators)
│   │   │   └── 📊 READINGS (Real-time SCADA data)
│   │   └── 📈 PERFORMANCE METRICS
│   └── 📋 ENERGY POLICIES
└── 👥 USERS (Authentication & Authorization)
```

## 📋 Collections Overview

| Collection | Purpose | Document Count (Est.) | Key Features |
|------------|---------|----------------------|--------------|
| **states** | Indian state information | 8 | Geographic, energy profile, policies |
| **plants** | Power generation facilities | 100-500 | Technical specs, financial data |
| **equipment** | Individual equipment units | 10,000-50,000 | SCADA integration, maintenance |
| **readings** | Time-series sensor data | Millions | High-frequency, time-optimized |
| **users** | Authentication & access control | 100-1,000 | Role-based permissions |

## 🏛️ State Collection

### **Purpose**: Store comprehensive information about Indian states

### **Key Parameters** (150+ fields):
- **Geographic Data**: Coordinates, area, climate, rainfall
- **Energy Infrastructure**: Total capacity, renewable mix, transmission
- **Economic Indicators**: GDP, tariffs, energy intensity
- **Renewable Potential**: Solar irradiation, wind speeds, hydro capacity
- **Government Policies**: Energy policies, targets, incentives
- **Demographics**: Population, electrification rates

### **Sample Document Structure**:
```javascript
{
  name: "Gujarat",
  code: "GJ",
  geography: {
    coordinates: { latitude: 23.0225, longitude: 72.5714 },
    area: { total: 196244, coastal: 1600, desert: 19500 },
    climate: "Arid",
    averageTemperature: { summer: 42, winter: 15, monsoon: 32 }
  },
  energyProfile: {
    totalCapacity: 28000, // MW
    renewableCapacity: 12500, // MW
    capacityBySource: {
      solar: 7500, wind: 3500, hydro: 1500
    }
  },
  renewablePotential: {
    solar: {
      technical: 35000, // MW
      solarIrradiation: 5.5 // kWh/m²/day
    }
  }
}
```

## 🏭 Plant Collection

### **Purpose**: Detailed power plant information with technical specifications

### **Key Parameters** (200+ fields):
- **Basic Info**: Name, type, location, capacity
- **Solar-Specific**: Panel type, inverters, tracking systems, efficiency
- **Wind-Specific**: Turbine models, hub height, power curves
- **Hydro-Specific**: Dam specifications, turbine types, reservoir data
- **Financial**: Project cost, tariffs, PPA details, LCOE
- **Environmental**: CO2 avoided, water saved, clearances
- **Operational**: Performance ratios, maintenance schedules

### **Sample Document Structure**:
```javascript
{
  name: "Charanka Solar Park",
  plantId: "GJ-SOL-123456",
  type: "Solar",
  location: {
    state: ObjectId("..."),
    coordinates: { latitude: 23.8103, longitude: 71.2136 }
  },
  technical: {
    capacity: { installed: 590, operational: 580 }, // MW
    solar: {
      panelType: "Monocrystalline",
      panelCount: 2360000,
      trackingSystem: "Single Axis",
      moduleEfficiency: 20.5,
      dcAcRatio: 1.3
    }
  },
  financial: {
    projectCost: 2950, // Crores INR
    tariff: 2.44, // INR per kWh
    lcoe: 2.15 // INR per kWh
  }
}
```

## ⚡ Equipment Collection

### **Purpose**: Individual equipment monitoring with SCADA integration

### **Key Parameters** (300+ fields):
- **Specifications**: Manufacturer, model, ratings, dimensions
- **Installation**: Location, commissioning, connections
- **Performance**: Efficiency, availability, degradation
- **Maintenance**: Schedules, history, warranty
- **Communication**: SCADA protocols, IP addresses
- **Safety**: Protection systems, lockout procedures
- **Environmental**: Operating conditions, vibration, temperature

### **Sample Document Structure**:
```javascript
{
  name: "Wind Turbine WT-001",
  equipmentId: "GJ-WND-WT001",
  type: "Wind Turbine",
  plant: ObjectId("..."),
  specifications: {
    manufacturer: "Vestas",
    model: "V120-2.2MW",
    ratings: { power: 2200, voltage: 690 }, // kW, V
    dimensions: { hubHeight: 90, rotorDiameter: 120 }
  },
  performance: {
    currentStatus: "Online",
    availability: 97.5, // %
    totalEnergyGenerated: 15750000 // kWh
  },
  communication: {
    protocol: "Modbus TCP",
    ipAddress: "192.168.1.101",
    communicationStatus: "Connected"
  }
}
```

## 📊 Reading Collection (Time-Series)

### **Purpose**: High-frequency SCADA data storage optimized for time-series queries

### **Key Parameters** (400+ fields):
- **Electrical**: Power, voltage, current, frequency, energy
- **Environmental**: Weather data, irradiance, wind speed, water levels
- **Mechanical**: Vibration, rotation, lubrication, cooling
- **Control**: Operating modes, setpoints, protection status
- **Performance**: Efficiency, availability, capacity factors
- **Alarms**: Real-time alerts and events

### **Sample Document Structure**:
```javascript
{
  equipment: ObjectId("..."),
  plant: ObjectId("..."),
  timestamp: ISODate("2025-06-16T16:30:00Z"),
  electrical: {
    activePower: 2150, // kW
    voltage: { l1: 690, l2: 692, l3: 688 }, // V
    current: { l1: 1850, l2: 1840, l3: 1860 }, // A
    frequency: 50.02, // Hz
    energy: { totalGeneration: 15750125 } // kWh
  },
  environmental: {
    weather: {
      windSpeed: 12.5, // m/s
      windDirection: 245, // degrees
      temperature: { ambient: 28, nacelle: 35 }, // °C
      humidity: 65 // %
    }
  },
  performance: {
    efficiency: 94.2, // %
    availability: 100, // %
    capacityFactor: 97.7 // %
  }
}
```

## 👥 User Collection

### **Purpose**: Authentication, authorization, and user management

### **Key Parameters** (100+ fields):
- **Personal Info**: Name, email, phone, avatar
- **Authentication**: Password, 2FA, session management
- **Authorization**: Roles, permissions, access scope
- **Professional**: Department, certifications, skills
- **Preferences**: Dashboard settings, notifications
- **Activity**: Login history, action logs

### **Role-Based Access Control**:
```javascript
{
  personalInfo: { firstName: "Rajesh", lastName: "Sharma" },
  authorization: {
    role: "Plant Manager",
    permissions: [
      { resource: "plants", actions: ["read", "update"] },
      { resource: "equipment", actions: ["read", "update"] },
      { resource: "readings", actions: ["read"] }
    ],
    accessScope: {
      plants: [ObjectId("...")], // Specific plants
      states: [ObjectId("...")] // Specific states
    }
  }
}
```

## 🔗 Relationships & Mappings

### **1. Hierarchical Relationships**
```
State (1) ←→ Plants (Many)
Plant (1) ←→ Equipment (Many)
Equipment (1) ←→ Readings (Many)
```

### **2. Reference Patterns**
- **State → Plants**: `Plant.location.state` references `State._id`
- **Plant → Equipment**: `Equipment.plant` references `Plant._id`
- **Equipment → Readings**: `Reading.equipment` references `Equipment._id`
- **Denormalized**: `Reading.plant` for faster aggregations

### **3. Query Optimization**
- **Compound Indexes**: `{equipment: 1, timestamp: -1}`
- **Geospatial Indexes**: `{coordinates: "2dsphere"}`
- **Time-Series Collection**: Optimized for readings
- **TTL Indexes**: Automatic data cleanup (2 years retention)

## 📈 Performance Considerations

### **Time-Series Optimization**
- MongoDB Time-Series Collections for readings
- Automatic bucketing by equipment and time
- Compressed storage for historical data
- Efficient aggregation pipelines

### **Indexing Strategy**
- Primary indexes on frequently queried fields
- Compound indexes for complex queries
- Geospatial indexes for location-based queries
- Sparse indexes for optional fields

### **Data Retention**
- Real-time data: 2 years (configurable)
- Aggregated data: Permanent
- Audit logs: 7 years
- User sessions: 30 days

## 🚀 Scalability Features

### **Horizontal Scaling**
- Sharding by state or plant for geographic distribution
- Read replicas for analytics workloads
- Connection pooling for high concurrency

### **Data Archival**
- Automated archival of old readings
- Compressed storage for historical data
- Cold storage integration for long-term retention

This schema supports millions of real-time data points while maintaining query performance and data integrity across the entire energy monitoring ecosystem.
