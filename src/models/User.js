const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * USER MODEL
 * Handles authentication and authorization for the energy dashboard
 */
const userSchema = new mongoose.Schema({
    // Basic Information
    personalInfo: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: 50
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: 50
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
            index: true
        },
        phone: {
            type: String,
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
        },
        avatar: String // URL to profile picture
    },

    // Authentication
    authentication: {
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 8,
            select: false // Don't include password in queries by default
        },

        // Password Reset
        passwordResetToken: String,
        passwordResetExpires: Date,
        passwordChangedAt: Date,

        // Account Security
        loginAttempts: { type: Number, default: 0 },
        lockUntil: Date,

        // Two-Factor Authentication
        twoFactorAuth: {
            enabled: { type: Boolean, default: false },
            secret: String,
            backupCodes: [String]
        },

        // Session Management
        refreshTokens: [{
            token: String,
            createdAt: { type: Date, default: Date.now },
            expiresAt: Date,
            deviceInfo: String
        }]
    },

    // Authorization & Roles
    authorization: {
        role: {
            type: String,
            required: true,
            enum: [
                'Super Admin',      // Full system access
                'Admin',           // State/Plant level admin
                'Plant Manager',   // Single plant management
                'Operator',        // Plant operations
                'Technician',      // Maintenance tasks
                'Analyst',         // Data analysis & reports
                'Viewer'           // Read-only access
            ],
            default: 'Viewer'
        },

        permissions: [{
            resource: {
                type: String,
                enum: [
                    'states', 'plants', 'equipment', 'readings',
                    'users', 'reports', 'maintenance', 'alarms',
                    'settings', 'analytics', 'exports'
                ]
            },
            actions: [{
                type: String,
                enum: ['create', 'read', 'update', 'delete', 'export', 'approve']
            }]
        }],

        // Access Scope
        accessScope: {
            states: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'State'
            }],
            plants: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Plant'
            }],
            equipmentTypes: [{
                type: String,
                enum: ['Solar Panel', 'Solar Inverter', 'Wind Turbine', 'Hydro Turbine', 'Generator']
            }]
        }
    },

    // Professional Information
    professional: {
        employeeId: String,
        department: {
            type: String,
            enum: [
                'Operations', 'Maintenance', 'Engineering', 'Management',
                'IT', 'Finance', 'Safety', 'Quality', 'Analytics'
            ]
        },
        designation: String,
        organization: String,

        experience: {
            total: Number, // years
            renewable: Number, // years in renewable energy
            current: Number // years in current organization
        },

        certifications: [{
            name: String,
            issuedBy: String,
            issuedDate: Date,
            expiryDate: Date,
            certificateNumber: String
        }],

        skills: [{
            name: String,
            level: {
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
            }
        }]
    },

    // Preferences & Settings
    preferences: {
        // Dashboard Preferences
        dashboard: {
            defaultView: {
                type: String,
                enum: ['Overview', 'Plants', 'Equipment', 'Analytics'],
                default: 'Overview'
            },
            refreshInterval: { type: Number, default: 30 }, // seconds
            chartType: {
                type: String,
                enum: ['Line', 'Bar', 'Area', 'Pie'],
                default: 'Line'
            },
            timeRange: {
                type: String,
                enum: ['1h', '6h', '24h', '7d', '30d'],
                default: '24h'
            }
        },

        // Notification Preferences
        notifications: {
            email: {
                enabled: { type: Boolean, default: true },
                frequency: {
                    type: String,
                    enum: ['Immediate', 'Hourly', 'Daily', 'Weekly'],
                    default: 'Immediate'
                },
                types: [{
                    type: String,
                    enum: ['Alarms', 'Maintenance', 'Reports', 'System'],
                    default: ['Alarms', 'Maintenance']
                }]
            },
            sms: {
                enabled: { type: Boolean, default: false },
                criticalOnly: { type: Boolean, default: true }
            },
            push: {
                enabled: { type: Boolean, default: true }
            }
        },

        // Display Preferences
        display: {
            language: { type: String, default: 'en' },
            timezone: { type: String, default: 'Asia/Kolkata' },
            dateFormat: { type: String, default: 'DD/MM/YYYY' },
            timeFormat: { type: String, default: '24h' },
            theme: {
                type: String,
                enum: ['Light', 'Dark', 'Auto'],
                default: 'Light'
            }
        }
    },

    // Activity Tracking
    activity: {
        lastLogin: Date,
        lastActivity: Date,
        loginCount: { type: Number, default: 0 },

        // Session History
        sessions: [{
            loginTime: Date,
            logoutTime: Date,
            ipAddress: String,
            userAgent: String,
            location: {
                country: String,
                state: String,
                city: String
            }
        }],

        // Action Log (last 100 actions)
        actions: [{
            action: String,
            resource: String,
            resourceId: String,
            timestamp: { type: Date, default: Date.now },
            ipAddress: String,
            details: mongoose.Schema.Types.Mixed
        }]
    },

    // Account Status
    status: {
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        isLocked: { type: Boolean, default: false },

        // Verification
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        emailVerifiedAt: Date,

        // Account Lifecycle
        activatedAt: Date,
        deactivatedAt: Date,
        lastPasswordChange: Date,

        // Compliance
        termsAccepted: {
            version: String,
            acceptedAt: Date
        },
        privacyPolicyAccepted: {
            version: String,
            acceptedAt: Date
        }
    },

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
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.authentication.password;
            delete ret.authentication.passwordResetToken;
            delete ret.authentication.twoFactorAuth.secret;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isAccountLocked').get(function () {
    return !!(this.authentication.lockUntil && this.authentication.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('authentication.password')) return next();

    // Hash password with cost of 12
    this.authentication.password = await bcrypt.hash(this.authentication.password, 12);

    // Set password changed timestamp
    this.authentication.passwordChangedAt = Date.now() - 1000;

    next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.authentication.password);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.authentication.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.authentication.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to check permissions
userSchema.methods.hasPermission = function (resource, action) {
    // Super Admin has all permissions
    if (this.authorization.role === 'Super Admin') return true;

    // Check specific permissions
    const permission = this.authorization.permissions.find(p => p.resource === resource);
    return permission && permission.actions.includes(action);
};

// Indexes
userSchema.index({ 'authorization.role': 1 });
userSchema.index({ 'status.isActive': 1 });
userSchema.index({ 'activity.lastLogin': -1 });

module.exports = mongoose.model('User', userSchema);
