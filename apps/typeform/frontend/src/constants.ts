const SDK_WINDOW_HEIGHT = 450;
const BASE_URL = 'https://api.typeform.com';

// TODO Move to env var
const TEST_CLIENT_ID = '7EugkySJjsYnSihDiYkGnMXrzbLBz7K8CFXS438Toqix';
const PROD_CLIENT_ID = 'HC3UDnoiaP1UCMqJ7kCAyTFdHrDt8nLtXx4BKRJxom2M';
const DEVELOPMENT_CLIENT_ID = '2vyzzT2AjqrtfWKmaigvZjF8oYwUXrJABmcS5WK4MPJg';

const getClientId = () => {
  // if prod return prod client id
  if (process.env.NODE_ENV === 'production') {
    return PROD_CLIENT_ID;
  } else if (process.env.NODE_ENV === 'staging') {
    return TEST_CLIENT_ID;
  } else if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_CLIENT_ID;
  } else {
    console.error('Unknown environment: ', process.env.NODE_ENV);
    return null;
  }
};

export { SDK_WINDOW_HEIGHT, BASE_URL, getClientId };
