var index = require('./index.js');

console.log("TESTING MODE");

index.nodeServer.startServer();
index.nodeClientsService.startService();