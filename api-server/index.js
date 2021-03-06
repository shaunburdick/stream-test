'use strict';

var app = require('connect')();
var serveStatic = require('serve-static');
var path = require('path');
var http = require('http');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var socketio = require('socket.io');
var socketHelper = require('./lib/socket');
var serverPort = process.env.PORT || 3000;

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: (process.env.NODE_ENV === 'development') // Conditionally turn on stubs (mock mode)
};

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  // Serve static files from pub
  app.use(serveStatic(path.join(__dirname, 'pub')));

  // Start the server
  const server = http.createServer(app);

  // setup socketio
  const io = socketio.listen(server);
  socketHelper.set(io);

  io.on('connection', (socket) => {
    console.log('User has connected');

    socket.on('disconnect', () => {
      console.log('User has disconnect');
    });
  });

  server.listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
});
