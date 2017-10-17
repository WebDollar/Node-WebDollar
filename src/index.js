require("babel-polyfill");

console.log("Node WebDollar");


let Node = require('./node/Node.js');

exports.NodeServer = Node.NodeServer;
exports.NodeClientsService = Node.NodeClientsService;

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};


console.log("Node WebDollar End");