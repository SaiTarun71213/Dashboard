# API Documentation

## Overview

The Energy Dashboard API provides comprehensive endpoints for managing energy sector data, charts, and dashboards. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.energydashboard.com/api
```

## Authentication

All endpoints (except login/register) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "timestamp": "2025-06-18T18:00:00.000Z"
}
```

Error responses include additional error details:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  },
  "timestamp": "2025-06-18T18:00:00.000Z"
}
```

## Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@energydashboard.com",
  "password": "Admin123!"
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh-token>"
}
```

## Chart Builder Endpoints

### List Charts
```http
GET /chart-builder/charts?page=1&limit=10&search=power&chartType=line
Authorization: Bearer <token>
```

### Create Chart
```http
POST /chart-builder/charts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Power Generation Trend",
  "description": "Daily power generation trend",
  "chartType": "line",
  "level": "PLANT",
  "config": {
    "xAxis": {
      "field": "timestamp",
      "label": "Time",
      "type": "datetime"
    },
    "yAxis": {
      "field": "electrical.activePower",
      "label": "Power (kW)",
      "type": "number"
    }
  }
}
```

### Get Chart
```http
GET /chart-builder/charts/{chartId}
Authorization: Bearer <token>
```

### Update Chart
```http
PUT /chart-builder/charts/{chartId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Chart Name",
  "description": "Updated description"
}
```

### Delete Chart
```http
DELETE /chart-builder/charts/{chartId}
Authorization: Bearer <token>
```

### Get Chart Data
```http
GET /chart-builder/charts/{chartId}/data?timeRange=24h&refresh=false
Authorization: Bearer <token>
```

## Dashboard Layout Endpoints

### List Dashboards
```http
GET /dashboard-layout/dashboards?page=1&limit=10&level=PLANT
Authorization: Bearer <token>
```

### Create Dashboard
```http
POST /dashboard-layout/dashboards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Solar Plant Overview",
  "description": "Real-time solar plant monitoring",
  "level": "PLANT",
  "dashboardType": "LIVE",
  "layout": {
    "columns": 12,
    "rows": 8,
    "gap": 16
  },
  "widgets": [
    {
      "type": "chart",
      "title": "Power Trend",
      "x": 0,
      "y": 0,
      "cols": 6,
      "rows": 4,
      "chartId": "chart_123"
    }
  ]
}
```

### Get Dashboard
```http
GET /dashboard-layout/dashboards/{dashboardId}?includeData=true
Authorization: Bearer <token>
```

### Update Dashboard
```http
PUT /dashboard-layout/dashboards/{dashboardId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Dashboard Name",
  "description": "Updated description"
}
```

### Delete Dashboard
```http
DELETE /dashboard-layout/dashboards/{dashboardId}
Authorization: Bearer <token>
```

### Add Widget to Dashboard
```http
POST /dashboard-layout/dashboards/{dashboardId}/widgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "metric",
  "title": "Total Power",
  "layout": {
    "x": 0,
    "y": 0,
    "width": 3,
    "height": 2
  },
  "config": {
    "metric": {
      "field": "electrical.activePower",
      "label": "Active Power",
      "unit": "kW",
      "aggregation": "SUM"
    }
  }
}
```

## Data Aggregation Endpoints

### Sector Aggregation
```http
GET /aggregation/sector?timeRange=24h&metrics=activePower,efficiency
Authorization: Bearer <token>
```

### State Aggregations
```http
GET /aggregation/states?stateId=state_123&timeRange=7d
Authorization: Bearer <token>
```

### Plant Aggregations
```http
GET /aggregation/plants?stateId=state_123&plantType=SOLAR&timeRange=30d
Authorization: Bearer <token>
```

## Real-time Data Endpoints

### Subscribe to Updates
```http
POST /realtime/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "level": "PLANT",
  "entityId": "plant_123",
  "metrics": ["activePower", "efficiency"],
  "interval": 30
}
```

### Unsubscribe from Updates
```http
POST /realtime/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscriptionId": "sub_123456"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination metadata is included in responses:

```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## WebSocket Events

Real-time data is delivered via WebSocket connections:

### Connection
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events
- `data-update`: Real-time metric updates
- `alert`: System alerts and notifications
- `status-change`: Equipment status changes
- `connection-status`: Connection health updates

## Interactive Documentation

For interactive API testing, visit the Swagger UI:
- Development: http://localhost:3000/api-docs
- Production: https://api.energydashboard.com/api-docs
