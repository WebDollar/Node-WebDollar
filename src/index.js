console.log("Node WebDollar");

exports.nodeServer = require('./node/server/sockets/node-server.js').server;
exports.nodeClientsService = require('./node/clients/service/node-clients-service.js').serviceClients;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");