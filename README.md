# FDE Technical Challenge: Inbound Carrier Sales Automation

## Overview
This project implements an inbound carrier sales automation system using the HappyRobot platform. The system handles calls from carriers looking to book loads, authenticates them, matches them to available loads, and negotiates pricing automatically.

## Features
- **Inbound Call Handling**: AI assistant receives calls from carriers
- **Carrier Authentication**: Verifies MC numbers using FMCSA API
- **Load Matching**: Searches and presents available loads based on criteria
- **Price Negotiation**: Handles up to 3 rounds of price negotiation
- **Call Transfer**: Transfers successful deals to sales representatives
- **Data Extraction**: Extracts relevant data from calls
- **Analytics**: Classifies call outcomes and sentiment
- **Dashboard**: Real-time metrics and reporting

## Project Structure
```
fde-inbound-carrier-sales/
├── api/                    # Backend API server
├── data/                   # Sample load data and schemas
├── dashboard/              # Metrics dashboard
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── docker/                 # Docker configuration
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker
- HappyRobot platform access
- FMCSA API access

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the API: `npm run dev`
5. Access dashboard at `http://localhost:3001`

### Docker Deployment
```bash
docker-compose up -d
```

## API Endpoints

### Load Management
- `GET /api/loads` - Get all available loads
- `GET /api/loads/:id` - Get specific load details
- `POST /api/loads/search` - Search loads by criteria

### Carrier Authentication
- `POST /api/carriers/verify` - Verify MC number with FMCSA

### Call Analytics
- `POST /api/calls/classify` - Classify call outcome and sentiment
- `GET /api/calls/metrics` - Get call metrics

## Environment Variables
```env
PORT=3000
NODE_ENV=development
FMCSA_API_KEY=your_fmcsa_api_key
HAPPYROBOT_API_KEY=your_happyrobot_api_key
DATABASE_URL=your_database_url
```

## Security Features
- HTTPS with self-signed certificates (local)
- API key authentication
- Input validation and sanitization
- Rate limiting

## Deployment
The application is containerized with Docker and can be deployed to:
- AWS
- Google Cloud
- Azure
- Fly.io
- Railway

## Documentation
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [HappyRobot Integration](./docs/happyrobot-integration.md)

## License
MIT License
