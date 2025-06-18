const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Import GraphQL schema and resolvers
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

/**
 * APOLLO GRAPHQL SERVER SETUP
 * Configures GraphQL server with authentication and context
 * Integrates with existing Express server
 */

// Schema is created directly in ApolloServer constructor

/**
 * GraphQL Context Function
 * Provides authentication and user context for resolvers
 */
async function createContext({ req, connection }) {
  // Handle WebSocket connections (for subscriptions)
  if (connection) {
    return {
      user: connection.context.user,
      isAuthenticated: !!connection.context.user
    };
  }

  // Handle HTTP requests
  let user = null;
  let isAuthenticated = false;

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      user = await User.findById(decoded.userId)
        .select('-security.password -security.refreshTokens')
        .populate('accessScope.states', 'name code')
        .populate('accessScope.plants', 'name type')
        .lean();

      if (user) {
        isAuthenticated = true;
      }
    }
  } catch (error) {
    console.error('GraphQL authentication error:', error);
    // Continue with unauthenticated context
  }

  return {
    user,
    isAuthenticated,
    req
  };
}

/**
 * WebSocket Connection Authentication
 * Handles authentication for GraphQL subscriptions
 */
async function onConnect(connectionParams) {
  try {
    const token = connectionParams.authorization || connectionParams.Authorization;

    if (!token) {
      throw new Error('Missing authentication token');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');

    // Verify JWT token
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId)
      .select('-security.password -security.refreshTokens')
      .populate('accessScope.states', 'name code')
      .populate('accessScope.plants', 'name type')
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user,
      isAuthenticated: true
    };

  } catch (error) {
    console.error('WebSocket authentication error:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Create Apollo Server Instance
 */
function createApolloServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (error) => {
      // Log error for debugging
      console.error('GraphQL Error:', error);

      // Return sanitized error for client
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_ERROR',
        path: error.path,
        locations: error.locations
      };
    },
    formatResponse: (response) => {
      // Add custom headers or modify response if needed
      return response;
    },
    plugins: [
      // Custom plugin for request logging
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              if (process.env.NODE_ENV === 'development') {
                console.log('GraphQL Operation:', requestContext.request.operationName);
              }
            },
            didEncounterErrors(requestContext) {
              console.error('GraphQL Errors:', requestContext.errors);
            }
          };
        }
      }
    ],
    // Enable CORS for GraphQL endpoint
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true
    }
  });
}

/**
 * Authentication Directive
 * Custom directive to protect GraphQL fields/types
 */
const authDirective = {
  typeDefs: `
    directive @auth(requires: [String!]) on FIELD_DEFINITION | OBJECT
  `,
  transformer: (schema) => {
    // Implementation for @auth directive
    // This can be used to protect specific fields or types
    return schema;
  }
};

/**
 * Rate Limiting for GraphQL
 * Prevents abuse of GraphQL endpoints
 */
const rateLimitRules = {
  // Limit complex queries
  maximumDepth: 10,
  maximumComplexity: 1000,

  // Limit query rate per user
  perMinute: 60,
  perHour: 1000,

  // Specific limits for expensive operations
  analytics: {
    perMinute: 10,
    perHour: 100
  },

  subscriptions: {
    perConnection: 5,
    perUser: 20
  }
};

/**
 * GraphQL Metrics Collection
 * Collects performance and usage metrics
 */
const metricsCollector = {
  queryCount: 0,
  mutationCount: 0,
  subscriptionCount: 0,
  errorCount: 0,
  avgResponseTime: 0,

  recordQuery(operationType, responseTime) {
    switch (operationType) {
      case 'query':
        this.queryCount++;
        break;
      case 'mutation':
        this.mutationCount++;
        break;
      case 'subscription':
        this.subscriptionCount++;
        break;
    }

    // Update average response time
    const totalOperations = this.queryCount + this.mutationCount + this.subscriptionCount;
    this.avgResponseTime = ((this.avgResponseTime * (totalOperations - 1)) + responseTime) / totalOperations;
  },

  recordError() {
    this.errorCount++;
  },

  getMetrics() {
    return {
      queries: this.queryCount,
      mutations: this.mutationCount,
      subscriptions: this.subscriptionCount,
      errors: this.errorCount,
      avgResponseTime: Math.round(this.avgResponseTime),
      uptime: process.uptime()
    };
  },

  reset() {
    this.queryCount = 0;
    this.mutationCount = 0;
    this.subscriptionCount = 0;
    this.errorCount = 0;
    this.avgResponseTime = 0;
  }
};

module.exports = {
  createApolloServer,
  createContext,
  onConnect,
  authDirective,
  rateLimitRules,
  metricsCollector
};
