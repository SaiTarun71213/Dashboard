# Deployment Guide

This guide covers deploying the Energy Dashboard application to various environments.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- Git
- Domain name (for production)
- SSL certificate (for production)

## Environment Setup

### Development Environment

1. **Clone Repository**
   ```bash
   git clone https://github.com/SaiTarun71213/Dashboard.git
   cd Dashboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ng serve
   ```

### Production Environment

## Docker Deployment

### Using Docker Compose

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:5.0
       container_name: energy-dashboard-db
       restart: unless-stopped
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: password
       volumes:
         - mongodb_data:/data/db
       ports:
         - "27017:27017"

     backend:
       build: ./backend
       container_name: energy-dashboard-api
       restart: unless-stopped
       environment:
         NODE_ENV: production
         MONGODB_URI: mongodb://admin:password@mongodb:27017/energy-dashboard?authSource=admin
         JWT_SECRET: your-production-jwt-secret
       ports:
         - "3000:3000"
       depends_on:
         - mongodb

     frontend:
       build: ./frontend
       container_name: energy-dashboard-web
       restart: unless-stopped
       ports:
         - "80:80"
       depends_on:
         - backend

   volumes:
     mongodb_data:
   ```

2. **Create Backend Dockerfile**
   ```dockerfile
   # backend/Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

3. **Create Frontend Dockerfile**
   ```dockerfile
   # frontend/Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist/energy-dashboard-frontend /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

4. **Deploy**
   ```bash
   docker-compose up -d
   ```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS

1. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name energy-dashboard-backend
   aws ecr create-repository --repository-name energy-dashboard-frontend
   ```

2. **Build and Push Images**
   ```bash
   # Backend
   docker build -t energy-dashboard-backend ./backend
   docker tag energy-dashboard-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/energy-dashboard-backend:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/energy-dashboard-backend:latest

   # Frontend
   docker build -t energy-dashboard-frontend ./frontend
   docker tag energy-dashboard-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/energy-dashboard-frontend:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/energy-dashboard-frontend:latest
   ```

3. **Create ECS Task Definition**
4. **Create ECS Service**
5. **Configure Load Balancer**
6. **Set up MongoDB Atlas**

#### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Application**
   ```bash
   cd backend
   eb init energy-dashboard-api
   eb create production
   ```

### Google Cloud Platform

#### Using Google Cloud Run

1. **Build and Deploy Backend**
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/PROJECT-ID/energy-dashboard-backend
   gcloud run deploy energy-dashboard-api --image gcr.io/PROJECT-ID/energy-dashboard-backend --platform managed
   ```

2. **Build and Deploy Frontend**
   ```bash
   cd frontend
   gcloud builds submit --tag gcr.io/PROJECT-ID/energy-dashboard-frontend
   gcloud run deploy energy-dashboard-web --image gcr.io/PROJECT-ID/energy-dashboard-frontend --platform managed
   ```

### Azure Deployment

#### Using Azure Container Instances

1. **Create Resource Group**
   ```bash
   az group create --name energy-dashboard --location eastus
   ```

2. **Deploy Containers**
   ```bash
   az container create --resource-group energy-dashboard --name energy-dashboard-api --image your-registry/energy-dashboard-backend:latest
   az container create --resource-group energy-dashboard --name energy-dashboard-web --image your-registry/energy-dashboard-frontend:latest
   ```

## Traditional Server Deployment

### Ubuntu Server Setup

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org

   # Install Nginx
   sudo apt install nginx -y

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/SaiTarun71213/Dashboard.git
   cd Dashboard

   # Setup backend
   cd backend
   npm install --production
   cp .env.example .env
   # Edit .env file
   npm run seed

   # Start with PM2
   pm2 start src/app.js --name energy-dashboard-api
   pm2 startup
   pm2 save

   # Build frontend
   cd ../frontend
   npm install
   npm run build

   # Copy to Nginx
   sudo cp -r dist/energy-dashboard-frontend/* /var/www/html/
   ```

3. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/energy-dashboard
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /var/www/html;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/energy-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## SSL Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment Variables

### Production Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
CORS_ORIGIN=https://your-domain.com
```

### Frontend Environment

```typescript
// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  wsUrl: 'wss://your-domain.com'
};
```

## Monitoring and Logging

### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs energy-dashboard-api
   ```

2. **Log Rotation**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 30
   ```

### Database Monitoring

```bash
# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Database stats
mongo --eval "db.stats()"
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db energy-dashboard --out /backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
rm -rf /backups/mongodb_$DATE

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### Application Backup

```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /path/to/Dashboard
```

## Health Checks

### Application Health

```bash
# Backend health check
curl http://localhost:3000/health

# Frontend health check
curl http://localhost/
```

### Automated Health Monitoring

```bash
# Create health check script
#!/bin/bash
if ! curl -f http://localhost:3000/health; then
    pm2 restart energy-dashboard-api
    echo "Backend restarted at $(date)" >> /var/log/health-check.log
fi
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **MongoDB Connection Issues**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

3. **Nginx Configuration Issues**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **PM2 Process Issues**
   ```bash
   pm2 restart all
   pm2 delete all && pm2 start ecosystem.config.js
   ```

### Log Locations

- Application logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- System logs: `/var/log/syslog`
