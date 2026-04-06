const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance App API',
      version: '1.0.0',
      description: 'API documentation for the Finance Application backend',
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  // Document all routes
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsDoc(options);

module.exports = {
  swaggerUi,
  specs,
};
