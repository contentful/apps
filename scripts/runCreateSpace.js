import contentful from 'contentful-management';
import { createSpace } from './actions/createSpace.js';

// Configuration values
const accessToken = '';
const organizationId = '6B7UvF9RgdtICSBSvSIUMY';
const appName = 'Your App Name';

// Create Contentful client
const client = contentful.createClient({
  accessToken: accessToken,
});

// Create a space
async function run() {
  try {
    console.log('Creating space...');
    const space = await createSpace(client, organizationId, appName);
    console.log('Space creation completed successfully!');
  } catch (error) {
    console.error('Error creating space:', error);
  }
}

run(); 