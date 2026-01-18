const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CMS E-commerce API',
      version: '1.0.0',
      description: 'API documentation for the CMS and E-commerce backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./swaggerDefinitions.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);
module.exports = specs;
