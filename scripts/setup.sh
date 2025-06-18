#!/bin/bash

# Energy Dashboard Setup Script
# This script sets up the development environment for the Energy Dashboard application

set -e

echo "🚀 Energy Dashboard Setup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18 or higher is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Checking MongoDB installation..."
    if command -v mongod &> /dev/null; then
        MONGO_VERSION=$(mongod --version | head -n1)
        print_success "MongoDB is installed: $MONGO_VERSION"
    else
        print_warning "MongoDB is not installed. Please install MongoDB 5.0+ from https://www.mongodb.com/try/download/community"
        print_status "You can also use MongoDB Atlas cloud service"
    fi
}

# Check if Angular CLI is installed
check_angular_cli() {
    print_status "Checking Angular CLI installation..."
    if command -v ng &> /dev/null; then
        NG_VERSION=$(ng version --skip-git 2>/dev/null | grep "Angular CLI" | head -n1)
        print_success "Angular CLI is installed: $NG_VERSION"
    else
        print_status "Installing Angular CLI globally..."
        npm install -g @angular/cli
        print_success "Angular CLI installed successfully"
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env file with your configuration"
    else
        print_success ".env file already exists"
    fi
    
    # Check if MongoDB is running and seed database
    if command -v mongod &> /dev/null; then
        print_status "Checking MongoDB connection..."
        if mongo --eval "db.adminCommand('ismaster')" &> /dev/null; then
            print_status "Seeding database with sample data..."
            npm run seed
            print_success "Database seeded successfully"
        else
            print_warning "MongoDB is not running. Please start MongoDB and run 'npm run seed' in the backend directory"
        fi
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the custom grid library
    print_status "Building custom grid library..."
    npm run build:lib
    
    cd ..
    print_success "Frontend setup completed"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Create start-dev.sh
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash

# Start development servers
echo "🚀 Starting Energy Dashboard Development Servers"

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend && ng serve &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "📊 Frontend: http://localhost:4200"
echo "🔧 Backend API: http://localhost:3000/api"
echo "📚 API Docs: http://localhost:3000/api-docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    # Create stop-dev.sh
    cat > scripts/stop-dev.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Energy Dashboard Development Servers"

# Kill processes on ports 3000 and 4200
echo "Stopping backend server (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Stopping frontend server (port 4200)..."
lsof -ti:4200 | xargs kill -9 2>/dev/null || true

echo "✅ All servers stopped"
EOF

    # Make scripts executable
    chmod +x scripts/start-dev.sh
    chmod +x scripts/stop-dev.sh
    
    print_success "Startup scripts created"
}

# Create package.json for root directory
create_root_package() {
    print_status "Creating root package.json..."
    
    cat > package.json << 'EOF'
{
  "name": "energy-dashboard",
  "version": "1.0.0",
  "description": "Energy Dashboard - MEAN Stack Application",
  "scripts": {
    "install:all": "npm run install:backend && npm run install:frontend",
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install",
    "start:dev": "./scripts/start-dev.sh",
    "stop:dev": "./scripts/stop-dev.sh",
    "start:backend": "cd backend && npm run dev",
    "start:frontend": "cd frontend && ng serve",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "build:all": "npm run build:backend && npm run build:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:all": "npm run test:backend && npm run test:frontend",
    "seed": "cd backend && npm run seed",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && ng lint",
    "lint:all": "npm run lint:backend && npm run lint:frontend"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/SaiTarun71213/Dashboard.git"
  },
  "keywords": [
    "energy",
    "dashboard",
    "angular",
    "nodejs",
    "mongodb",
    "express",
    "mean-stack"
  ],
  "author": "Sai Tarun",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF
    
    print_success "Root package.json created"
}

# Main setup function
main() {
    echo ""
    print_status "Starting Energy Dashboard setup..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_mongodb
    check_angular_cli
    
    echo ""
    print_status "Setting up project..."
    
    # Setup backend and frontend
    setup_backend
    setup_frontend
    
    # Create utility files
    create_startup_scripts
    create_root_package
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/.env file with your configuration"
    echo "2. Start MongoDB if not already running"
    echo "3. Run 'npm run start:dev' to start development servers"
    echo ""
    echo "Useful commands:"
    echo "- npm run start:dev    # Start both servers"
    echo "- npm run stop:dev     # Stop both servers"
    echo "- npm run seed         # Seed database with sample data"
    echo "- npm run build:all    # Build both applications"
    echo ""
    echo "Access points:"
    echo "- Frontend: http://localhost:4200"
    echo "- Backend API: http://localhost:3000/api"
    echo "- API Documentation: http://localhost:3000/api-docs"
    echo ""
}

# Run main function
main
