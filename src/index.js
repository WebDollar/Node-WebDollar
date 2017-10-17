require("babel-polyfill");

console.log("Node WebDollar");

let NodeServer = require('./node/server/sockets/node-server.js').NodeServer;
let NodeClientsService = require('./node/clients/service/node-clients-service.js').NodeClientsService;

exports.NodeServer = NodeServer;
exports.NodeClientsService = NodeClientsService;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");