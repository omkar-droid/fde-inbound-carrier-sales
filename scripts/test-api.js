const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'demo-key';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
};

async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testLoadEndpoints() {
  console.log('\n🔍 Testing Load Endpoints...');
  
  try {
    // Test get all loads
    console.log('Testing GET /api/loads...');
    const loadsResponse = await axios.get(`${API_BASE_URL}/api/loads`, { headers });
    console.log('✅ Get loads successful:', loadsResponse.data.count, 'loads found');
    
    // Test get specific load
    console.log('Testing GET /api/loads/L001...');
    const loadResponse = await axios.get(`${API_BASE_URL}/api/loads/L001`, { headers });
    console.log('✅ Get specific load successful:', loadResponse.data.data.load_id);
    
    // Test search loads
    console.log('Testing POST /api/loads/search...');
    const searchResponse = await axios.post(`${API_BASE_URL}/api/loads/search`, {
      origin: 'Los Angeles',
      destination: 'Phoenix',
      equipment_type: 'Dry Van'
    }, { headers });
    console.log('✅ Search loads successful:', searchResponse.data.count, 'matches found');
    
    return true;
  } catch (error) {
    console.error('❌ Load endpoints failed:', error.message);
    return false;
  }
}

async function testCarrierEndpoints() {
  console.log('\n🔍 Testing Carrier Endpoints...');
  
  try {
    // Test valid MC number
    console.log('Testing valid MC number (123456)...');
    const validResponse = await axios.post(`${API_BASE_URL}/api/carriers/verify`, {
      mc_number: '123456'
    }, { headers });
    console.log('✅ Valid MC verification successful:', validResponse.data.data.is_valid);
    
    // Test invalid MC number
    console.log('Testing invalid MC number (999999)...');
    const invalidResponse = await axios.post(`${API_BASE_URL}/api/carriers/verify`, {
      mc_number: '999999'
    }, { headers });
    console.log('✅ Invalid MC verification successful:', !invalidResponse.data.data.is_valid);
    
    return true;
  } catch (error) {
    console.error('❌ Carrier endpoints failed:', error.message);
    return false;
  }
}

async function testCallAnalytics() {
  console.log('\n🔍 Testing Call Analytics Endpoints...');
  
  try {
    // Test call classification
    console.log('Testing POST /api/calls/classify...');
    const classifyResponse = await axios.post(`${API_BASE_URL}/api/calls/classify`, {
      call_transcript: 'Carrier was very interested in the load and accepted the price immediately.',
      final_price: 1200,
      negotiation_rounds: 1
    }, { headers });
    console.log('✅ Call classification successful:', classifyResponse.data.data.outcome);
    
    // Test metrics
    console.log('Testing GET /api/calls/metrics...');
    const metricsResponse = await axios.get(`${API_BASE_URL}/api/calls/metrics`, { headers });
    console.log('✅ Metrics successful:', metricsResponse.data.data.total_calls, 'total calls');
    
    return true;
  } catch (error) {
    console.error('❌ Call analytics failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...');
  
  try {
    // Test invalid API key
    console.log('Testing invalid API key...');
    try {
      await axios.get(`${API_BASE_URL}/api/loads`, {
        headers: { 'X-API-Key': 'invalid-key' }
      });
      console.log('❌ Should have failed with invalid API key');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid API key properly rejected');
      } else {
        console.log('❌ Unexpected error for invalid API key:', error.message);
        return false;
      }
    }
    
    // Test missing MC number
    console.log('Testing missing MC number...');
    try {
      await axios.post(`${API_BASE_URL}/api/carriers/verify`, {}, { headers });
      console.log('❌ Should have failed with missing MC number');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Missing MC number properly rejected');
      } else {
        console.log('❌ Unexpected error for missing MC number:', error.message);
        return false;
      }
    }
    
    // Test non-existent load
    console.log('Testing non-existent load...');
    try {
      await axios.get(`${API_BASE_URL}/api/loads/NONEXISTENT`, { headers });
      console.log('❌ Should have failed with non-existent load');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Non-existent load properly rejected');
      } else {
        console.log('❌ Unexpected error for non-existent load:', error.message);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling tests failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Load Endpoints', fn: testLoadEndpoints },
    { name: 'Carrier Endpoints', fn: testCarrierEndpoints },
    { name: 'Call Analytics', fn: testCallAnalytics },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) passed++;
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testLoadEndpoints,
  testCarrierEndpoints,
  testCallAnalytics,
  testErrorHandling,
  runAllTests
};
