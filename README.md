# Energy Dashboard - MEAN Stack Application

A comprehensive energy sector dashboard application built with the MEAN stack (MongoDB, Express.js, Angular, Node.js) for monitoring and analyzing energy data across solar, wind, and hydro power plants in India.

## 🌟 Features

### Frontend (Angular)
- **Interactive Dashboard Designer** with drag-drop functionality
- **Chart Builder** with support for multiple chart types (Line, Bar, Pie, Area, etc.)
- **Real-time Data Visualization** using Highcharts
- **Responsive Grid System** with fixed 12-column layout
- **Widget Configuration** with energy-specific parameters
- **Authentication & Authorization** with JWT tokens
- **HTTP Interceptors** for seamless API integration

### Backend (Node.js + Express)
- **RESTful API** with comprehensive endpoints
- **JWT Authentication** with refresh token support
- **MongoDB Integration** with Mongoose ODM
- **Real-time Data** via WebSocket connections
- **Data Aggregation** at sector/state/plant/equipment levels
- **Swagger Documentation** for API reference
- **Error Handling** and validation middleware

### Key Capabilities
- **Multi-level Data Hierarchy**: Sector → State → Plant → Equipment
- **Chart Types**: Line, Bar, Column, Area, Pie, Scatter, Bubble charts
- **Dashboard Types**: Live (real-time) and Analytical (historical)
- **Energy Metrics**: Power generation, efficiency, capacity factor, environmental data
- **Template System**: Reusable dashboard and chart templates
- **Export/Import**: Dashboard configuration backup and restore

## 🏗️ Project Structure

```
energy-dashboard/
├── frontend/                 # Angular Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Angular Components
│   │   │   ├── services/     # Angular Services
│   │   │   ├── interceptors/ # HTTP Interceptors
│   │   │   ├── guards/       # Route Guards
│   │   │   └── models/       # TypeScript Interfaces
│   │   ├── assets/           # Static Assets
│   │   └── environments/     # Environment Configurations
│   ├── package.json
│   └── angular.json
├── backend/                  # Node.js Backend Application
│   ├── src/
│   │   ├── controllers/      # Route Controllers
│   │   ├── models/           # MongoDB Models
│   │   ├── routes/           # API Routes
│   │   ├── services/         # Business Logic Services
│   │   ├── middleware/       # Express Middleware
│   │   └── utils/            # Utility Functions
│   ├── package.json
│   └── swagger.yaml          # API Documentation
├── docs/                     # Documentation
├── scripts/                  # Utility Scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- Angular CLI (v17 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SaiTarun71213/Dashboard.git
   cd Dashboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npm run seed    # Seed database with sample data
   npm start       # Start backend server
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ng serve        # Start development server
   ```

4. **Access the Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000/api
   - API Documentation: http://localhost:3000/api-docs

### Default Login Credentials
- **Admin**: admin@energydashboard.com / Admin123!
- **Manager**: manager@energydashboard.com / Manager123!
- **Operator**: operator@energydashboard.com / Operator123!

## 📊 Dashboard Features

### Chart Builder
- **Drag & Drop Interface**: Intuitive chart creation
- **Multiple Chart Types**: Line, Bar, Column, Area, Pie, Scatter, Bubble
- **Data Field Selection**: Choose from 19+ energy-specific metrics
- **Aggregation Options**: SUM, AVERAGE, MIN, MAX, COUNT
- **Time Range Selection**: 1h, 6h, 24h, 7d, 30d presets
- **Multi-series Support**: Multiple data series per chart

### Dashboard Designer
- **Grid-based Layout**: Fixed 12-column responsive grid
- **Widget Management**: Add, configure, resize, and remove widgets
- **Saved Chart Integration**: Use charts created in Chart Builder
- **Template System**: Save and reuse dashboard configurations
- **Real-time Updates**: Live data refresh every minute

### Energy Data Metrics
- **Electrical Parameters**: Active/Reactive Power, Voltage, Current, Frequency
- **Performance Metrics**: Efficiency, Capacity Factor, Availability
- **Environmental Data**: Temperature, Humidity, Wind Speed, Solar Irradiance
- **Status Information**: Operational Status, Alarm Count, Equipment Health

## 🔧 API Documentation

The backend provides comprehensive RESTful APIs documented with Swagger/OpenAPI 3.0:

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh access token

### Chart Builder Endpoints
- `GET /api/chart-builder/charts` - List all charts
- `POST /api/chart-builder/charts` - Create new chart
- `GET /api/chart-builder/charts/{id}` - Get specific chart
- `PUT /api/chart-builder/charts/{id}` - Update chart
- `DELETE /api/chart-builder/charts/{id}` - Delete chart

### Dashboard Layout Endpoints
- `GET /api/dashboard-layout/dashboards` - List user dashboards
- `POST /api/dashboard-layout/dashboards` - Create new dashboard
- `GET /api/dashboard-layout/dashboards/{id}` - Get dashboard
- `PUT /api/dashboard-layout/dashboards/{id}` - Update dashboard
- `DELETE /api/dashboard-layout/dashboards/{id}` - Delete dashboard

### Data Aggregation Endpoints
- `GET /api/aggregation/sector` - Sector-level aggregation
- `GET /api/aggregation/states` - State-level aggregations
- `GET /api/aggregation/plants` - Plant-level aggregations

## 🛠️ Technology Stack

### Frontend
- **Angular 17**: Modern web framework
- **Angular Material**: UI component library
- **Highcharts**: Advanced charting library
- **Angular Gridster2**: Grid layout system
- **RxJS**: Reactive programming
- **TypeScript**: Type-safe JavaScript

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Socket.io**: Real-time communication
- **Swagger**: API documentation

### Development Tools
- **Angular CLI**: Angular development tools
- **Nodemon**: Auto-restart development server
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **HTTP Interceptors**: Automatic token management
- **Role-based Access Control**: Admin, Manager, Operator, Viewer roles
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error management
- **Rate Limiting**: API request throttling

## 📈 Performance Features

- **Lazy Loading**: On-demand component loading
- **HTTP Caching**: Intelligent response caching
- **Data Pagination**: Efficient large dataset handling
- **Real-time Updates**: WebSocket-based live data
- **Responsive Design**: Mobile-first approach
- **Code Splitting**: Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Sai Tarun** - *Initial work* - [SaiTarun71213](https://github.com/SaiTarun71213)

## 🙏 Acknowledgments

- Angular team for the excellent framework
- Highcharts for powerful charting capabilities
- MongoDB team for the robust database
- Express.js community for the web framework
- All contributors and supporters of this project

## 📞 Support

For support, email support@energydashboard.com or create an issue in the GitHub repository.

---

**Built with ❤️ for the Energy Sector**
