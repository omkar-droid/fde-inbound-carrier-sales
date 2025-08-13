# API Documentation

## Overview
The FDE Inbound Carrier Sales API provides endpoints for managing loads, authenticating carriers, and analyzing call data.

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication
All API endpoints require authentication using an API key in the request headers:

```
X-API-Key: your-api-key-here
```

or

```
Authorization: Bearer your-api-key-here
```

## Endpoints

### Health Check
**GET** `/health`

Returns the health status of the API.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Load Management

#### Get All Loads
**GET** `/api/loads`

Returns all available loads.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "load_id": "L001",
      "origin": "Los Angeles, CA",
      "destination": "Phoenix, AZ",
      "pickup_datetime": "2024-01-15T08:00:00Z",
      "delivery_datetime": "2024-01-16T14:00:00Z",
      "equipment_type": "Dry Van",
      "loadboard_rate": 1200,
      "notes": "Urgent delivery needed. Fragile electronics.",
      "weight": 15000,
      "commodity_type": "Electronics",
      "num_of_pieces": 50,
      "miles": 380,
      "dimensions": "48' x 8.5' x 8.5'"
    }
  ],
  "count": 8
}
```

#### Get Specific Load
**GET** `/api/loads/:id`

Returns details for a specific load.

**Parameters:**
- `id` (string): Load ID

**Response:**
```json
{
  "success": true,
  "data": {
    "load_id": "L001",
    "origin": "Los Angeles, CA",
    "destination": "Phoenix, AZ",
    "pickup_datetime": "2024-01-15T08:00:00Z",
    "delivery_datetime": "2024-01-16T14:00:00Z",
    "equipment_type": "Dry Van",
    "loadboard_rate": 1200,
    "notes": "Urgent delivery needed. Fragile electronics.",
    "weight": 15000,
    "commodity_type": "Electronics",
    "num_of_pieces": 50,
    "miles": 380,
    "dimensions": "48' x 8.5' x 8.5'"
  }
}
```

#### Search Loads
**POST** `/api/loads/search`

Search loads based on criteria.

**Request Body:**
```json
{
  "origin": "Los Angeles",
  "destination": "Phoenix",
  "equipment_type": "Dry Van",
  "min_rate": 1000,
  "max_rate": 1500
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "load_id": "L001",
      "origin": "Los Angeles, CA",
      "destination": "Phoenix, AZ",
      "loadboard_rate": 1200
    }
  ],
  "count": 1
}
```

### Carrier Authentication

#### Verify Carrier
**POST** `/api/carriers/verify`

Verify a carrier's MC number with FMCSA.

**Request Body:**
```json
{
  "mc_number": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mc_number": "123456",
    "is_valid": true,
    "carrier_name": "Carrier 123456",
    "status": "ACTIVE",
    "authority_type": "Motor Carrier"
  }
}
```

### Call Analytics

#### Classify Call
**POST** `/api/calls/classify`

Classify call outcome and sentiment.

**Request Body:**
```json
{
  "call_transcript": "Carrier was interested in the load and accepted the price.",
  "final_price": 1200,
  "negotiation_rounds": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outcome": "SUCCESS",
    "sentiment": "POSITIVE",
    "confidence": 0.85,
    "extracted_data": {
      "final_price": 1200,
      "negotiation_rounds": 2,
      "call_duration": 245,
      "key_topics": ["pricing", "delivery_time", "equipment_type"]
    }
  }
}
```

#### Get Call Metrics
**GET** `/api/calls/metrics`

Returns aggregated call metrics and analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_calls": 150,
    "successful_calls": 89,
    "failed_calls": 61,
    "average_negotiation_rounds": 2.3,
    "average_call_duration": 245,
    "success_rate": 59.3,
    "sentiment_distribution": {
      "positive": 45,
      "neutral": 35,
      "negative": 20
    },
    "outcome_distribution": {
      "success": 89,
      "negotiation_failed": 35,
      "no_interest": 26
    },
    "top_equipment_types": [
      { "type": "Dry Van", "count": 45 },
      { "type": "Reefer", "count": 32 },
      { "type": "Flatbed", "count": 28 }
    ]
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (invalid API key)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Data Models

### Load Object
```json
{
  "load_id": "string",
  "origin": "string",
  "destination": "string",
  "pickup_datetime": "ISO 8601 datetime",
  "delivery_datetime": "ISO 8601 datetime",
  "equipment_type": "string",
  "loadboard_rate": "number",
  "notes": "string",
  "weight": "number",
  "commodity_type": "string",
  "num_of_pieces": "number",
  "miles": "number",
  "dimensions": "string"
}
```

### Carrier Object
```json
{
  "mc_number": "string",
  "is_valid": "boolean",
  "carrier_name": "string",
  "status": "string",
  "authority_type": "string"
}
```

### Call Classification Object
```json
{
  "outcome": "SUCCESS|NEGOTIATION_FAILED|NO_INTEREST|UNKNOWN",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "confidence": "number",
  "extracted_data": {
    "final_price": "number",
    "negotiation_rounds": "number",
    "call_duration": "number",
    "key_topics": ["string"]
  }
}
```
