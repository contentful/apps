const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Add cors middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint for Klaviyo API
app.use('/api/klaviyo/proxy', async (req, res) => {
  console.log('Proxy request received:', req.method, req.path);

  // Forward to lambda.app.js validation endpoint
  if (req.path.includes('/validate-credentials')) {
    try {
      const privateKey = req.headers.authorization?.replace('Bearer ', '') || req.body?.privateKey;

      if (!privateKey) {
        return res.status(400).json({ valid: false, error: 'Private key is required' });
      }

      console.log('Validating Klaviyo credentials');

      // Try to validate with the Klaviyo API
      const response = await axios.get('https://a.klaviyo.com/api/accounts/', {
        headers: {
          Accept: 'application/json',
          revision: '2023-08-15',
          Authorization: `Klaviyo-API-Key ${privateKey}`,
        },
      });

      return res.json({ valid: true, data: response.data });
    } catch (error) {
      console.error('Error validating credentials:', error.message);

      // Handle API errors
      if (error.response) {
        return res.status(error.response.status).json({
          valid: false,
          error: error.response.data.message || 'Authentication failed',
        });
      }

      return res.status(500).json({
        valid: false,
        error: error.message,
      });
    }
  }

  // Handle other Klaviyo API requests
  try {
    // Pass the request through to lambda or Klaviyo directly
    res.status(200).json({ message: 'Proxy working!' });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Klaviyo Proxy server running on http://localhost:${PORT}`);
});
