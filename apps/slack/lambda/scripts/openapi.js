const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Slack App',
      version: '1.0.0',
    },
  },
  apis: ['./lambda/lib/routes/**/controller.ts'], // files containing annotations as above
};

(function main() {
  const specPath = path.resolve(__dirname, '..', 'docs', 'openapi.json');
  console.log('Writing new documentation at', specPath);
  fs.writeFileSync(specPath, JSON.stringify(swaggerJsdoc(options), null, 2));
})();
