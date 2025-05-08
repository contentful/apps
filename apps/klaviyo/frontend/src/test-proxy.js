import axios from 'axios';
import { API_PROXY_URL, getProxyUrl } from './config/klaviyo';

// This function tests if the proxy server is accessible
export async function testProxyConnection() {
  try {
    // Use the helper function to get the appropriate URL based on environment
    const proxyUrl = getProxyUrl();
    console.log('Using proxy URL:', proxyUrl);

    // Try to access the test endpoint
    const response = await axios.get(`${proxyUrl}/test`);
    console.log('Proxy test successful:', response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Proxy test failed:', error);
    return {
      success: false,
      error: error.message,
      // Additional debug info
      request: {
        url: `${getProxyUrl()}/test`,
        method: 'GET',
      },
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
          }
        : null,
    };
  }
}

// Run the test if this file is directly executed
if (import.meta.url === import.meta.main) {
  testProxyConnection()
    .then((result) => console.log('Test result:', result))
    .catch((err) => console.error('Test error:', err));
}
