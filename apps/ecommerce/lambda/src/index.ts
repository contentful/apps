import app from './app';
import serverless from 'serverless-http';

export const handler = serverless(app);
