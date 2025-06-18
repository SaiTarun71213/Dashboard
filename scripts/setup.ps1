# Energy Dashboard Setup Script for Windows
# This script sets up the development environment for the Energy Dashboard application

param(
    [switch]$SkipDependencyCheck,
    [switch]$Force
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Check-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Check-NodeJS {
    Write-Status "Checking Node.js installation..."
    
    if (Check-Command "node") {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        
        # Check if version is 18 or higher
        $majorVersion = [int]($nodeVersion -replace "v", "" -split "\.")[0]
        if ($majorVersion -lt 18) {
            Write-Warning "Node.js version 18 or higher is recommended. Current: $nodeVersion"
        }
        return $true
    }
    else {
        Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        return $false
    }
}

function Check-MongoDB {
    Write-Status "Checking MongoDB installation..."
    
    if (Check-Command "mongod") {
        try {
            $mongoVersion = mongod --version | Select-Object -First 1
            Write-Success "MongoDB is installed: $mongoVersion"
            return $true
        }
        catch {
            Write-Warning "MongoDB command found but version check failed"
            return $false
        }
    }
    else {
        Write-Warning "MongoDB is not installed. Please install MongoDB 5.0+ from https://www.mongodb.com/try/download/community"
        Write-Status "You can also use MongoDB Atlas cloud service"
        return $false
    }
}

function Check-AngularCLI {
    Write-Status "Checking Angular CLI installation..."
    
    if (Check-Command "ng") {
        try {
            $ngVersion = ng version --skip-git 2>$null | Select-String "Angular CLI" | Select-Object -First 1
            Write-Success "Angular CLI is installed: $ngVersion"
            return $true
        }
        catch {
            Write-Status "Installing Angular CLI globally..."
            npm install -g @angular/cli
            Write-Success "Angular CLI installed successfully"
            return $true
        }
    }
    else {
        Write-Status "Installing Angular CLI globally..."
        npm install -g @angular/cli
        Write-Success "Angular CLI installed successfully"
        return $true
    }
}

function Setup-Backend {
    Write-Status "Setting up backend..."
    
    Set-Location backend
    
    # Install dependencies
    Write-Status "Installing backend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-Status "Creating .env file from template..."
        Copy-Item ".env.example" ".env"
        Write-Warning "Please edit backend\.env file with your configuration"
    }
    else {
        Write-Success ".env file already exists"
    }
    
    # Check if MongoDB is running and seed database
    if (Check-Command "mongo") {
        Write-Status "Checking MongoDB connection..."
        try {
            $mongoTest = mongo --eval "db.adminCommand('ismaster')" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Status "Seeding database with sample data..."
                npm run seed
                Write-Success "Database seeded successfully"
            }
            else {
                Write-Warning "MongoDB is not running. Please start MongoDB and run 'npm run seed' in the backend directory"
            }
        }
        catch {
            Write-Warning "Could not connect to MongoDB. Please ensure MongoDB is running"
        }
    }
    
    Set-Location ..
    Write-Success "Backend setup completed"
}

function Setup-Frontend {
    Write-Status "Setting up frontend..."
    
    Set-Location frontend
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # Build the custom grid library
    Write-Status "Building custom grid library..."
    npm run build:lib
    
    Set-Location ..
    Write-Success "Frontend setup completed"
}

function Create-StartupScripts {
    Write-Status "Creating startup scripts..."
    
    # Create start-dev.ps1
    $startDevScript = @'
# Start development servers
Write-Host "🚀 Starting Energy Dashboard Development Servers" -ForegroundColor Green

# Start backend in background
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; ng serve" -WindowStyle Normal

Write-Host "✅ Servers started!" -ForegroundColor Green
Write-Host "📊 Frontend: http://localhost:4200" -ForegroundColor Yellow
Write-Host "🔧 Backend API: http://localhost:3000/api" -ForegroundColor Yellow
Write-Host "📚 API Docs: http://localhost:3000/api-docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the PowerShell windows to stop the servers" -ForegroundColor Cyan
'@

    # Create stop-dev.ps1
    $stopDevScript = @'
Write-Host "🛑 Stopping Energy Dashboard Development Servers" -ForegroundColor Red

# Kill processes on ports 3000 and 4200
Write-Host "Stopping backend server (port 3000)..." -ForegroundColor Cyan
try {
    $backendProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($backendProcess) {
        $processId = (Get-Process -Id $backendProcess.OwningProcess -ErrorAction SilentlyContinue).Id
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
catch {
    # Ignore errors
}

Write-Host "Stopping frontend server (port 4200)..." -ForegroundColor Cyan
try {
    $frontendProcess = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
    if ($frontendProcess) {
        $processId = (Get-Process -Id $frontendProcess.OwningProcess -ErrorAction SilentlyContinue).Id
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}
catch {
    # Ignore errors
}

Write-Host "✅ All servers stopped" -ForegroundColor Green
'@

    $startDevScript | Out-File -FilePath "scripts\start-dev.ps1" -Encoding UTF8
    $stopDevScript | Out-File -FilePath "scripts\stop-dev.ps1" -Encoding UTF8
    
    Write-Success "Startup scripts created"
}

function Create-RootPackage {
    Write-Status "Creating root package.json..."
    
    $packageJson = @'
{
  "name": "energy-dashboard",
  "version": "1.0.0",
  "description": "Energy Dashboard - MEAN Stack Application",
  "scripts": {
    "install:all": "npm run install:backend && npm run install:frontend",
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install",
    "start:dev": "powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1",
    "stop:dev": "powershell -ExecutionPolicy Bypass -File scripts/stop-dev.ps1",
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
'@
    
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    Write-Success "Root package.json created"
}

function Main {
    Write-Host ""
    Write-Host "🚀 Energy Dashboard Setup Script" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Status "Starting Energy Dashboard setup..."
    Write-Host ""
    
    # Check prerequisites
    $nodeOk = Check-NodeJS
    $mongoOk = Check-MongoDB
    $ngOk = Check-AngularCLI
    
    if (-not $nodeOk -and -not $SkipDependencyCheck) {
        Write-Error "Node.js is required. Please install it and run the script again."
        exit 1
    }
    
    Write-Host ""
    Write-Status "Setting up project..."
    
    # Setup backend and frontend
    Setup-Backend
    Setup-Frontend
    
    # Create utility files
    Create-StartupScripts
    Create-RootPackage
    
    Write-Host ""
    Write-Success "🎉 Setup completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Edit backend\.env file with your configuration"
    Write-Host "2. Start MongoDB if not already running"
    Write-Host "3. Run 'npm run start:dev' to start development servers"
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "- npm run start:dev    # Start both servers"
    Write-Host "- npm run stop:dev     # Stop both servers"
    Write-Host "- npm run seed         # Seed database with sample data"
    Write-Host "- npm run build:all    # Build both applications"
    Write-Host ""
    Write-Host "Access points:" -ForegroundColor Yellow
    Write-Host "- Frontend: http://localhost:4200"
    Write-Host "- Backend API: http://localhost:3000/api"
    Write-Host "- API Documentation: http://localhost:3000/api-docs"
    Write-Host ""
}

# Run main function
Main
