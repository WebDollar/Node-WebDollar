console.log("Node WebDollar");

exports.nodeServer = require('./nodes/server/sockets/nodes-server.js').server;
exports.nodeClientService = require('./nodes/clients/service/nodes-clients-service.js').serviceClients;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");