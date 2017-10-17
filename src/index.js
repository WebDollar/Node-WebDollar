console.log("Node WebDollar");

exports.nodeServer = require('./sockets/node/server/node-server.js').server;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");