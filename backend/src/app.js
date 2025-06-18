const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allows your Angular frontend to communicate with backend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200', // Angular default port
    credentials: true
}));

// Logging middleware - logs all HTTP requests
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check endpoint - useful for deployment monitoring
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Energy Dashboard API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));

// Swagger UI setup
const swaggerOptions = {
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #1976d2; }
        .swagger-ui .scheme-container { background: #fafafa; }
    `,
    customSiteTitle: "Energy Dashboard API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
    }
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// API documentation redirect
app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
});

// Import API routes
const apiRoutes = require('./routes');

// Mount API routes
app.use('/api', apiRoutes);

// GraphQL endpoint will be added by server.js before starting

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(isDevelopment && { stack: err.stack })
        }
    });
});

// 404 handler - when route doesn't exist (will be added after GraphQL setup)
function setup404Handler(app) {
    app.use('*', (req, res) => {
        res.status(404).json({
            error: {
                message: `Route ${req.originalUrl} not found`,
                availableRoutes: ['/health', '/api', '/api-docs', '/docs', '/graphql']
            }
        });
    });
}

module.exports = { app, setup404Handler };
