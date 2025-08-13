const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging and compression
app.use(morgan('combined'));
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required' 
    });
  }
  
  next();
};

// Load data
let loadsData = [];
try {
  loadsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/loads.json'), 'utf8'));
  console.log(`Loaded ${loadsData.length} loads from data file`);
} catch (error) {
  console.error('Error loading loads data:', error.message);
  // Use empty array if file not found
  loadsData = [];
}

// Mock FMCSA API response
const mockFMCSAResponse = (mcNumber) => {
  const validMCs = ['123456', '789012', '345678', '901234'];
  return {
    mc_number: mcNumber,
    is_valid: validMCs.includes(mcNumber),
    carrier_name: validMCs.includes(mcNumber) ? `Carrier ${mcNumber}` : null,
    status: validMCs.includes(mcNumber) ? 'ACTIVE' : 'INVALID',
    authority_type: validMCs.includes(mcNumber) ? 'Motor Carrier' : null
  };
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Load management endpoints
app.get('/api/loads', authenticateApiKey, (req, res) => {
  try {
    res.json({
      success: true,
      data: loadsData,
      count: loadsData.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch loads' 
    });
  }
});

app.get('/api/loads/:id', authenticateApiKey, (req, res) => {
  try {
    const load = loadsData.find(l => l.load_id === req.params.id);
    
    if (!load) {
      return res.status(404).json({ 
        success: false, 
        error: 'Load not found' 
      });
    }
    
    res.json({
      success: true,
      data: load
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch load' 
    });
  }
});

app.post('/api/loads/search', authenticateApiKey, (req, res) => {
  try {
    const { origin, destination, equipment_type, min_rate, max_rate } = req.body;
    
    let filteredLoads = loadsData;
    
    if (origin) {
      filteredLoads = filteredLoads.filter(load => 
        load.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    
    if (destination) {
      filteredLoads = filteredLoads.filter(load => 
        load.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (equipment_type) {
      filteredLoads = filteredLoads.filter(load => 
        load.equipment_type.toLowerCase() === equipment_type.toLowerCase()
      );
    }
    
    if (min_rate) {
      filteredLoads = filteredLoads.filter(load => 
        load.loadboard_rate >= min_rate
      );
    }
    
    if (max_rate) {
      filteredLoads = filteredLoads.filter(load => 
        load.loadboard_rate <= max_rate
      );
    }
    
    res.json({
      success: true,
      data: filteredLoads,
      count: filteredLoads.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search loads' 
    });
  }
});

// Carrier authentication endpoint
app.post('/api/carriers/verify', authenticateApiKey, (req, res) => {
  try {
    const { mc_number } = req.body;
    
    if (!mc_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'MC number is required' 
      });
    }
    
    // In production, this would call the actual FMCSA API
    const fmcsaResponse = mockFMCSAResponse(mc_number);
    
    res.json({
      success: true,
      data: fmcsaResponse
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify carrier' 
    });
  }
});

// Call analytics endpoints
app.post('/api/calls/classify', authenticateApiKey, (req, res) => {
  try {
    const { call_transcript, final_price, negotiation_rounds } = req.body;
    
    // Simple classification logic (in production, this would use ML/AI)
    let outcome = 'UNKNOWN';
    let sentiment = 'NEUTRAL';
    
    if (final_price && final_price > 0) {
      outcome = 'SUCCESS';
      sentiment = 'POSITIVE';
    } else if (negotiation_rounds >= 3) {
      outcome = 'NEGOTIATION_FAILED';
      sentiment = 'NEGATIVE';
    } else if (call_transcript) {
      const positiveWords = ['interested', 'accept', 'good', 'deal', 'yes'];
      const negativeWords = ['no', 'reject', 'too expensive', 'not interested'];
      
      const transcript = call_transcript.toLowerCase();
      const positiveCount = positiveWords.filter(word => transcript.includes(word)).length;
      const negativeCount = negativeWords.filter(word => transcript.includes(word)).length;
      
      if (positiveCount > negativeCount) {
        sentiment = 'POSITIVE';
      } else if (negativeCount > positiveCount) {
        sentiment = 'NEGATIVE';
      }
    }
    
    res.json({
      success: true,
      data: {
        outcome,
        sentiment,
        confidence: 0.85,
        extracted_data: {
          final_price,
          negotiation_rounds,
          call_duration: Math.floor(Math.random() * 300) + 60, // Mock duration
          key_topics: ['pricing', 'delivery_time', 'equipment_type']
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to classify call' 
    });
  }
});

app.get('/api/calls/metrics', authenticateApiKey, (req, res) => {
  try {
    // Mock metrics data
    const metrics = {
      total_calls: 150,
      successful_calls: 89,
      failed_calls: 61,
      average_negotiation_rounds: 2.3,
      average_call_duration: 245,
      success_rate: 59.3,
      sentiment_distribution: {
        positive: 45,
        neutral: 35,
        negative: 20
      },
      outcome_distribution: {
        success: 89,
        negotiation_failed: 35,
        no_interest: 26
      },
      top_equipment_types: [
        { type: 'Dry Van', count: 45 },
        { type: 'Reefer', count: 32 },
        { type: 'Flatbed', count: 28 }
      ]
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch metrics' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
// Always use HTTP for Railway deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
});

module.exports = app;
