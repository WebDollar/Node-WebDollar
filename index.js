console.log("Node WebDollar");

exports.printMsg = function() {
    console.log("This is a message from the demo package");
};

exports = {
    "nodeServer": require('./src/sockets/node/server/node-server.js'),
}

console.log("Node WebDollar End");