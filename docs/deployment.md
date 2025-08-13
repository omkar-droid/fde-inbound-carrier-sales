# Deployment Guide

## Overview
This guide covers deploying the FDE Inbound Carrier Sales system to various cloud platforms.

## Prerequisites
- Docker and Docker Compose installed
- Cloud platform account (AWS, GCP, Azure, Fly.io, Railway)
- Domain name (optional but recommended)
- SSL certificates

## Local Development Deployment

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd fde-inbound-carrier-sales

# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

### 2. Install Dependencies
```bash
# Install API dependencies
cd api
npm install

# Install Dashboard dependencies
cd ../dashboard
npm install
```

### 3. Start Services
```bash
# Start API server
cd api
npm run dev

# Start Dashboard (in new terminal)
cd dashboard
npm start
```

### 4. Test the Application
- API: http://localhost:3000/health
- Dashboard: http://localhost:3001
- API Documentation: http://localhost:3000/api

## Docker Deployment

### 1. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Environment Variables for Docker
```bash
# Create .env file for Docker
cat > .env << EOF
API_KEY=your-secret-api-key-here
FMCSA_API_KEY=your-fmcsa-api-key
HAPPYROBOT_API_KEY=your-happyrobot-api-key
NODE_ENV=production
EOF
```

### 3. SSL Certificate Setup (Production)
```bash
# Create SSL directory
mkdir -p api/ssl

# Generate self-signed certificates (for testing)
openssl req -x509 -newkey rsa:4096 -keyout api/ssl/key.pem -out api/ssl/cert.pem -days 365 -nodes

# For production, use Let's Encrypt or your CA
```

## Cloud Platform Deployments

### AWS Deployment

#### Option 1: AWS ECS with Fargate

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name fde-carrier-sales
```

2. **Build and Push Images**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t fde-carrier-sales-api ./api
docker build -t fde-carrier-sales-dashboard ./dashboard

# Tag for ECR
docker tag fde-carrier-sales-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fde-carrier-sales:api
docker tag fde-carrier-sales-dashboard:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/fde-carrier-sales:dashboard

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fde-carrier-sales:api
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/fde-carrier-sales:dashboard
```

3. **Create ECS Task Definition**
```json
{
  "family": "fde-carrier-sales",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/fde-carrier-sales:api",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "API_KEY", "value": "your-api-key"},
        {"name": "FMCSA_API_KEY", "value": "your-fmcsa-key"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fde-carrier-sales",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

4. **Create ECS Service**
```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name fde-carrier-sales \
  --task-definition fde-carrier-sales:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

#### Option 2: AWS EC2 with Docker

1. **Launch EC2 Instance**
```bash
# Use Amazon Linux 2 AMI
# Instance type: t3.medium or larger
# Security group: Allow ports 80, 443, 3000, 3001
```

2. **Install Docker on EC2**
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Deploy Application**
```bash
# Clone repository
git clone <repository-url>
cd fde-inbound-carrier-sales

# Set environment variables
cp env.example .env
nano .env

# Start services
docker-compose up -d
```

### Google Cloud Platform (GCP) Deployment

#### Option 1: Google Cloud Run

1. **Enable Required APIs**
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

2. **Build and Deploy**
```bash
# Build and push API
gcloud builds submit --tag gcr.io/<project-id>/fde-carrier-api ./api
gcloud run deploy fde-carrier-api \
  --image gcr.io/<project-id>/fde-carrier-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,API_KEY=your-key"

# Build and push Dashboard
gcloud builds submit --tag gcr.io/<project-id>/fde-carrier-dashboard ./dashboard
gcloud run deploy fde-carrier-dashboard \
  --image gcr.io/<project-id>/fde-carrier-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option 2: Google Kubernetes Engine (GKE)

1. **Create GKE Cluster**
```bash
gcloud container clusters create fde-carrier-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium
```

2. **Deploy with Kubernetes**
```bash
# Create namespace
kubectl create namespace fde-carrier

# Apply configurations
kubectl apply -f k8s/ -n fde-carrier
```

### Azure Deployment

#### Option 1: Azure Container Instances

1. **Build and Push to Azure Container Registry**
```bash
# Create ACR
az acr create --resource-group myResourceGroup --name fderegistry --sku Basic

# Build and push
az acr build --registry fderegistry --image fde-carrier-api ./api
az acr build --registry fderegistry --image fde-carrier-dashboard ./dashboard
```

2. **Deploy to Container Instances**
```bash
# Deploy API
az container create \
  --resource-group myResourceGroup \
  --name fde-carrier-api \
  --image fderegistry.azurecr.io/fde-carrier-api:latest \
  --dns-name-label fde-carrier-api \
  --ports 3000 \
  --environment-variables NODE_ENV=production API_KEY=your-key

# Deploy Dashboard
az container create \
  --resource-group myResourceGroup \
  --name fde-carrier-dashboard \
  --image fderegistry.azurecr.io/fde-carrier-dashboard:latest \
  --dns-name-label fde-carrier-dashboard \
  --ports 3000
```

### Fly.io Deployment

1. **Install Fly CLI**
```bash
# macOS
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

2. **Login and Deploy**
```bash
# Login to Fly
fly auth login

# Deploy API
cd api
fly launch --name fde-carrier-api
fly secrets set API_KEY=your-key FMCSA_API_KEY=your-fmcsa-key
fly deploy

# Deploy Dashboard
cd ../dashboard
fly launch --name fde-carrier-dashboard
fly secrets set REACT_APP_API_KEY=your-key
fly deploy
```

### Railway Deployment

1. **Connect Repository**
- Go to railway.app
- Connect your GitHub repository
- Railway will auto-detect the Docker setup

2. **Configure Environment Variables**
```env
API_KEY=your-secret-api-key
FMCSA_API_KEY=your-fmcsa-api-key
HAPPYROBOT_API_KEY=your-happyrobot-api-key
NODE_ENV=production
```

3. **Deploy**
- Railway will automatically build and deploy from your `docker-compose.yml`
- Services will be available at Railway-generated URLs

## Production Considerations

### 1. SSL/TLS Certificates
```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### 2. Load Balancer Configuration
```nginx
# Nginx configuration for load balancing
upstream api_backend {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://dashboard:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Database Setup (Optional)
```bash
# PostgreSQL with Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=fde_carrier_sales \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:13
```

### 4. Monitoring and Logging
```bash
# Prometheus for metrics
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Grafana for visualization
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

## Health Checks

### API Health Check
```bash
curl -f http://your-domain.com/health
```

### Dashboard Health Check
```bash
curl -f http://your-domain.com/
```

### Docker Health Check
```bash
docker-compose ps
docker-compose logs api
docker-compose logs dashboard
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

2. **Docker Build Failures**
```bash
# Clean Docker cache
docker system prune -a
# Rebuild without cache
docker-compose build --no-cache
```

3. **Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env
# Verify environment variables
docker-compose config
```

4. **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout
# Renew Let's Encrypt certificate
sudo certbot renew
```

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
docker exec postgres pg_dump -U postgres fde_carrier_sales > backup.sql

# Restore
docker exec -i postgres psql -U postgres fde_carrier_sales < backup.sql
```

### Application Backup
```bash
# Backup configuration
tar -czf fde-carrier-backup-$(date +%Y%m%d).tar.gz \
  docker-compose.yml \
  .env \
  data/ \
  docs/
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] API key authentication implemented
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] Error messages don't expose sensitive data
- [ ] Regular security updates
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Access logs enabled
- [ ] SSL certificates valid and auto-renewing
